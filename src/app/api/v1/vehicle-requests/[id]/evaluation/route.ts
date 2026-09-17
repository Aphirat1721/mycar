import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const schema = z.object({ rating: z.number().int().min(1).max(5), feedback: z.string().max(255).optional().default("") });
function canReview(user: Awaited<ReturnType<typeof requireUser>>) { return user.roles.some(({ role }) => role.key === "DRIVER_EVALUATION_REVIEWER"); }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const evaluation = await prisma.driverEvaluation.findUnique({ where: { vehicleRequestId: id } });
  if (!evaluation) return NextResponse.json({ data: null });
  if (evaluation.evaluatorId !== user.id && !canReview(user)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  return NextResponse.json({ data: evaluation });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const vehicleRequest = await prisma.vehicleRequest.findUnique({ where: { publicId: id }, select: { id: true, publicId: true, requesterId: true, driverId: true, status: true } });
    if (!vehicleRequest) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (vehicleRequest.requesterId !== user.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (vehicleRequest.status !== "COMPLETED" || !vehicleRequest.driverId) return NextResponse.json({ error: "NOT_ELIGIBLE" }, { status: 400 });
    const current = await prisma.driverEvaluation.findUnique({ where: { vehicleRequestId: vehicleRequest.id } });
    if (current?.acknowledgedAt) return NextResponse.json({ error: "ACKNOWLEDGED_LOCKED" }, { status: 409 });
    const evaluation = await prisma.driverEvaluation.upsert({ where: { vehicleRequestId: vehicleRequest.id }, create: { vehicleRequestId: vehicleRequest.id, evaluatorId: user.id, driverId: vehicleRequest.driverId, rating: body.rating, feedback: body.feedback }, update: { rating: body.rating, feedback: body.feedback } });
    await audit({ userId: user.id, action: current ? "UPDATE_DRIVER_EVALUATION" : "CREATE_DRIVER_EVALUATION", resource: "DRIVER_EVALUATION", resourceId: id, result: "SUCCESS" });
    return NextResponse.json({ data: evaluation });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ข้อมูลการประเมินไม่ถูกต้อง" }, { status: 400 });
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canReview(user)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { id } = await params;
    const evaluation = await prisma.driverEvaluation.findUnique({ where: { vehicleRequestId: id } });
    if (!evaluation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (evaluation.acknowledgedAt) return NextResponse.json({ error: "ALREADY_ACKNOWLEDGED" }, { status: 409 });
    const updated = await prisma.driverEvaluation.update({ where: { id: evaluation.id }, data: { acknowledgedAt: new Date(), acknowledgedById: user.id } });
    await audit({ userId: user.id, action: "ACKNOWLEDGE_DRIVER_EVALUATION", resource: "DRIVER_EVALUATION", resourceId: id, result: "SUCCESS" });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}
