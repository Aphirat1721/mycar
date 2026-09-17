import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ nameTh: "asc" }, { firstnameTh: "asc" }],
      select: {
        publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true,
        driver: { select: { publicId: true, firstName: true, lastName: true } },
      },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: forbidden ? 403 : 401 });
  }
}
