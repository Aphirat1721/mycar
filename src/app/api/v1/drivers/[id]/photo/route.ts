import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/authorization";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5 * 1024 * 1024;
const storageRoot = path.join(process.cwd(), "storage", "drivers");

function detectImage(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: ".jpg", contentType: "image/jpeg" };
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: ".png", contentType: "image/png" };
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return { extension: ".webp", contentType: "image/webp" };
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const driver = await prisma.driver.findUnique({ where: { publicId: id } });
    if (!driver || driver.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "PHOTO_REQUIRED" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "INVALID_PHOTO" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const detected = detectImage(bytes);
    if (!detected || file.type !== detected.contentType) return NextResponse.json({ error: "INVALID_PHOTO" }, { status: 400 });
    await mkdir(storageRoot, { recursive: true });
    const filename = `${driver.publicId}${detected.extension}`;
    await writeFile(path.join(storageRoot, filename), bytes, { flag: "w" });
    const photoPath = `/mycar/api/v1/drivers/${driver.publicId}/photo`;
    await prisma.driver.update({ where: { id: driver.id }, data: { photoPath } });
    await audit({ userId: user.id, action: "UPLOAD", resource: "DRIVER_PHOTO", resourceId: id, result: "SUCCESS", metadata: { contentType: detected.contentType, size: bytes.length } });
    return NextResponse.json({ photoPath });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: 403 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const driver = await prisma.driver.findUnique({ where: { publicId: id } });
    if (!driver?.photoPath) return new NextResponse(null, { status: 404 });
    const extension = path.extname(driver.photoPath);
    if (![".jpg", ".png", ".webp"].includes(extension)) return new NextResponse(null, { status: 404 });
    const filePath = path.join(storageRoot, `${driver.publicId}${extension}`);
    const bytes = await readFile(filePath);
    const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(bytes, { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
