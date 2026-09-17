import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const departments = await prisma.department.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: [{ nameTh: "asc" }, { abbreviation: "asc" }], select: { publicId: true, abbreviation: true, nameTh: true } });
  return NextResponse.json({ data: departments });
}
