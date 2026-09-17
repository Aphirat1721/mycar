import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireSuperAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true, organizationHcode: true, organizationName: true, status: true, roles: { select: { role: { select: { key: true, nameTh: true } } } } },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHENTICATED" }, { status: 403 });
  }
}
