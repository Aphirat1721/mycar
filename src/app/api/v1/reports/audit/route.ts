import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get("limit") || 200), 500);
  const createdAt: Record<string, Date> = {};
  if (searchParams.get("from")) createdAt.gte = new Date(`${searchParams.get("from")}T00:00:00.000Z`);
  if (searchParams.get("to")) createdAt.lte = new Date(`${searchParams.get("to")}T23:59:59.999Z`);
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(searchParams.get("resource") ? { resource: searchParams.get("resource")! } : {}),
      ...(searchParams.get("result") ? { result: searchParams.get("result")! as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } } },
  });
  return NextResponse.json({ rows: logs });
}
