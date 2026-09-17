import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/identity/session";
import { hasPermission } from "@/lib/authorization";
import type { Prisma } from "@/generated/prisma/client";

type PersonLike = { id?: string; publicId?: string; nameTh?: string | null; firstnameTh?: string | null; lastnameTh?: string | null };
type EvaluationLike = { evaluatorId: string; evaluator: PersonLike; equipmentReadiness: number; cleanliness: number; facilitationConvenience: number; roomSuitability: number; overallRating: number; issueCategory?: string | null; createdAt: Date };
type AggregateRow = { name: string; bookings: number; hours: number; attendees: number; completed: number };
type RequesterRow = { id: string | undefined; name: string; bookings: number; hours: number; completed: number; cancelled: number; evaluated: number };
type IndividualRow = { id: string | undefined; name: string; count: number; equipment: number; cleanliness: number; facilitation: number; suitability: number; overall: number; issues: number; last: Date | null };
type ApproverRow = { id: string | undefined; name: string; approved: number; completed: number; cancelled: number; avgDecisionHours: number; _times: number[] };
type WorkloadRow = { id: string | undefined; name: string; assigned: number; notStarted: number; inProgress: number; ready: number; completed: number; avgPreparationLeadHours: number; _lead: number[] };
type EquipmentRow = { id: string; name: string; code: string | null; bookingCount: number; quantity: number };
type MonthRow = { month: string; bookings: number; completed: number; hours: number; evaluations: number };

const nameOf = (u: PersonLike | null | undefined) => u?.nameTh || [u?.firstnameTh, u?.lastnameTh].filter(Boolean).join(" ") || "ไม่ระบุ";
const issueName: Record<string, string> = { EQUIPMENT: "อุปกรณ์", CLEANLINESS: "ความสะอาด", AIR_CONDITIONING: "เครื่องปรับอากาศ", AUDIO: "เครื่องเสียง", PROJECTOR: "โปรเจกเตอร์", INTERNET: "อินเทอร์เน็ต", PREPARATION: "การเตรียมห้อง", OTHER: "อื่น ๆ" };
const statusName: Record<string, string> = { PENDING: "รออนุมัติ", APPROVED: "อนุมัติแล้ว", REJECTED: "ปฏิเสธ", CANCELLED: "ยกเลิก", COMPLETED: "เสร็จสิ้น" };
const hoursBetween = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / 3600000);
const rangeFor = (from: string | null, to: string | null) => {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00+07:00`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999+07:00`) } : {}),
  };
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const admin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
  if (!admin && !(await hasPermission(user.id, "VIEW_MEETING_REPORTS"))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const q = new URL(req.url).searchParams;
  const from = q.get("from");
  const to = q.get("to");
  const roomId = q.get("roomId");
  const departmentId = q.get("departmentId");
  const preparedById = q.get("preparedById");
  const mode = q.get("mode") || "overview";

  const bookingWhere: Prisma.MeetingBookingWhereInput = {};
  const dateRange = rangeFor(from, to);
  if (dateRange) bookingWhere.startAt = dateRange;
  if (roomId) bookingWhere.room = { publicId: roomId };
  if (departmentId) bookingWhere.department = { publicId: departmentId };
  if (preparedById) bookingWhere.preparedBy = { publicId: preparedById };

  const [bookings, rooms, departments, preparers] = await Promise.all([
    prisma.meetingBooking.findMany({
      where: bookingWhere,
      orderBy: { startAt: "desc" },
      take: 5000,
      include: {
        room: { select: { publicId: true, nameTh: true, capacity: true, status: true } },
        department: { select: { publicId: true, nameTh: true } },
        requester: { select: { id: true, publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } },
        approvedBy: { select: { id: true, nameTh: true, firstnameTh: true, lastnameTh: true } },
        preparedBy: { select: { id: true, publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } },
        evaluation: true,
        equipment: { include: { equipment: { select: { publicId: true, nameTh: true, code: true } } } },
      },
    }),
    prisma.meetingRoom.findMany({ where: { deletedAt: null }, orderBy: { nameTh: "asc" }, select: { publicId: true, nameTh: true, capacity: true, status: true } }),
    prisma.department.findMany({ where: { deletedAt: null }, orderBy: { nameTh: "asc" }, select: { publicId: true, nameTh: true } }),
    prisma.user.findMany({ where: { preparedMeetingBookings: { some: {} } }, orderBy: [{ nameTh: "asc" }, { firstnameTh: "asc" }], select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } }),
  ]);

  const evaluationDateRange = rangeFor(from, to);
  const evaluationWhere: Prisma.MeetingBookingEvaluationWhereInput = {
    ...(evaluationDateRange ? { createdAt: evaluationDateRange } : {}),
    ...(roomId ? { booking: { room: { publicId: roomId } } } : {}),
    ...(preparedById ? { booking: { ...(roomId ? { room: { publicId: roomId } } : {}), preparedBy: { publicId: preparedById } } } : {}),
  };
  const evaluations = await prisma.meetingBookingEvaluation.findMany({
    where: evaluationWhere,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      booking: {
        select: {
          publicId: true,
          title: true,
          startAt: true,
          room: { select: { publicId: true, nameTh: true } },
          preparedBy: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } },
          department: { select: { publicId: true, nameTh: true } },
        },
      },
      evaluator: { select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true } },
    },
  });

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const approved = bookings.filter((b) => b.status === "APPROVED").length;
  const rejected = bookings.filter((b) => b.status === "REJECTED").length;
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const usable = bookings.filter((b) => ["APPROVED", "COMPLETED"].includes(b.status));
  const usedHours = usable.reduce((s, b) => s + hoursBetween(b.startAt, b.endAt), 0);
  const attendeeCount = bookings.reduce((s, b) => s + b.attendeeCount, 0);
  const evaluatedBookings = bookings.filter((b) => !!b.evaluation);
  const average = (field: keyof Pick<EvaluationLike, "overallRating" | "equipmentReadiness" | "cleanliness" | "facilitationConvenience" | "roomSuitability">) => evaluations.length ? Number((evaluations.reduce((s, e) => s + Number(e[field] ?? 0), 0) / evaluations.length).toFixed(2)) : 0;
  const responseRate = completed ? Number((evaluatedBookings.filter((b) => b.status === "COMPLETED").length / completed * 100).toFixed(1)) : 0;

  const approvalTimes = bookings.filter((b) => b.approvedAt).map((b) => hoursBetween(b.createdAt, b.approvedAt!));
  const avgApprovalHours = approvalTimes.length ? Number((approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length).toFixed(2)) : 0;
  const rejectedReasons = new Map<string, number>();
  bookings.filter((b) => b.status === "REJECTED").forEach((b) => { const k = b.rejectionReason?.trim() || "ไม่ระบุเหตุผล"; rejectedReasons.set(k, (rejectedReasons.get(k) || 0) + 1); });

  const aggregate = (key: (b: (typeof bookings)[number]) => string) => {
    const map = new Map<string, AggregateRow>();
    for (const b of bookings) {
      const k = key(b); const x = map.get(k) || { name: k, bookings: 0, hours: 0, attendees: 0, completed: 0 };
      x.bookings++; x.attendees += b.attendeeCount; if (["APPROVED", "COMPLETED"].includes(b.status)) x.hours += hoursBetween(b.startAt, b.endAt); if (b.status === "COMPLETED") x.completed++;
      map.set(k, x);
    }
    return [...map.values()].sort((a, b) => b.bookings - a.bookings);
  };
  const roomReport = aggregate((b) => b.room.nameTh).map((x) => ({ ...x, capacity: rooms.find((r) => r.nameTh === x.name)?.capacity ?? 0, hours: Number(x.hours.toFixed(2)) }));
  const departmentReport = aggregate((b) => b.department?.nameTh || "ไม่ระบุ").map((x) => ({ ...x, hours: Number(x.hours.toFixed(2)) }));
  const requesterMap = new Map<string, RequesterRow>();
  for (const b of bookings) { const id = b.requester.id; const x = requesterMap.get(id) || { id: b.requester.publicId, name: nameOf(b.requester), bookings: 0, hours: 0, completed: 0, cancelled: 0, evaluated: 0 }; x.bookings++; if (["APPROVED", "COMPLETED"].includes(b.status)) x.hours += hoursBetween(b.startAt, b.endAt); if (b.status === "COMPLETED") x.completed++; if (b.status === "CANCELLED") x.cancelled++; if (b.evaluation) x.evaluated++; requesterMap.set(id, x); }
  const requesterReport = [...requesterMap.values()].map((x) => ({ ...x, hours: Number(x.hours.toFixed(2)) })).sort((a, b) => b.bookings - a.bookings);

  const individualMap = new Map<string, IndividualRow>();
  for (const e of evaluations) {
    const id = e.evaluatorId;
    const x = individualMap.get(id) || { id: e.evaluator.publicId, name: nameOf(e.evaluator), count: 0, equipment: 0, cleanliness: 0, facilitation: 0, suitability: 0, overall: 0, issues: 0, last: null as Date | null };
    x.count++; x.equipment += e.equipmentReadiness; x.cleanliness += e.cleanliness; x.facilitation += e.facilitationConvenience; x.suitability += e.roomSuitability; x.overall += e.overallRating; if (e.issueCategory) x.issues++; if (!x.last || e.createdAt > x.last) x.last = e.createdAt; individualMap.set(id, x);
  }
  const individualReport = [...individualMap.values()].map((x) => ({ id: x.id, name: x.name, count: x.count, equipment: Number((x.equipment / x.count).toFixed(2)), cleanliness: Number((x.cleanliness / x.count).toFixed(2)), facilitation: Number((x.facilitation / x.count).toFixed(2)), suitability: Number((x.suitability / x.count).toFixed(2)), overall: Number((x.overall / x.count).toFixed(2)), issues: x.issues, last: x.last?.toISOString() || null })).sort((a, b) => b.count - a.count);

  const approverMap = new Map<string, ApproverRow>();
  for (const b of bookings.filter((x) => x.approvedBy)) { const id = b.approvedBy!.id; const x = approverMap.get(id) || { id, name: nameOf(b.approvedBy), approved: 0, completed: 0, cancelled: 0, avgDecisionHours: 0, _times: [] as number[] }; x.approved++; if (b.status === "COMPLETED") x.completed++; if (b.status === "CANCELLED") x.cancelled++; if (b.approvedAt) x._times.push(hoursBetween(b.createdAt, b.approvedAt)); approverMap.set(id, x); }
  const approverReport = [...approverMap.values()].map((x) => ({ ...x, avgDecisionHours: x._times.length ? Number((x._times.reduce((a, b) => a + b, 0) / x._times.length).toFixed(2)) : 0 })).sort((a, b) => b.approved - a.approved);

  const workloadMap = new Map<string, WorkloadRow>();
  for (const b of bookings.filter((x) => x.preparedBy)) { const id = b.preparedBy!.id; const x = workloadMap.get(id) || { id, name: nameOf(b.preparedBy), assigned: 0, notStarted: 0, inProgress: 0, ready: 0, completed: 0, avgPreparationLeadHours: 0, _lead: [] as number[] }; x.assigned++; if (b.preparationStatus === "NOT_STARTED") x.notStarted++; if (b.preparationStatus === "IN_PROGRESS") x.inProgress++; if (b.preparationStatus === "READY") x.ready++; if (b.status === "COMPLETED") x.completed++; if (b.preparedAt) x._lead.push(hoursBetween(b.preparedAt, b.startAt)); workloadMap.set(id, x); }
  const workloadReport = [...workloadMap.values()].map((x) => ({ ...x, avgPreparationLeadHours: x._lead.length ? Number((x._lead.reduce((a, b) => a + b, 0) / x._lead.length).toFixed(2)) : 0 })).sort((a, b) => b.assigned - a.assigned);
  const preparation = { notStarted: bookings.filter((b) => ["APPROVED", "COMPLETED"].includes(b.status) && b.preparationStatus === "NOT_STARTED").length, inProgress: bookings.filter((b) => b.preparationStatus === "IN_PROGRESS").length, ready: bookings.filter((b) => b.preparationStatus === "READY").length, completed };

  const equipmentMap = new Map<string, EquipmentRow>();
  for (const b of bookings) for (const item of b.equipment) { const k = item.equipment.publicId; const x = equipmentMap.get(k) || { id: k, name: item.equipment.nameTh, code: item.equipment.code, bookingCount: 0, quantity: 0 }; x.bookingCount++; x.quantity += item.quantity; equipmentMap.set(k, x); }
  const equipmentReport = [...equipmentMap.values()].sort((a, b) => b.quantity - a.quantity);

  const issueMap = new Map<string, number>();
  for (const e of evaluations) if (e.issueCategory) issueMap.set(issueName[e.issueCategory] || e.issueCategory, (issueMap.get(issueName[e.issueCategory] || e.issueCategory) || 0) + 1);
  const issues = [...issueMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const monthMap = new Map<string, MonthRow>();
  for (const b of bookings) { const key = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Asia/Bangkok" }).format(b.startAt); const x = monthMap.get(key) || { month: key, bookings: 0, completed: 0, hours: 0, evaluations: 0 }; x.bookings++; if (b.status === "COMPLETED") x.completed++; if (["APPROVED", "COMPLETED"].includes(b.status)) x.hours += hoursBetween(b.startAt, b.endAt); if (b.evaluation) x.evaluations++; monthMap.set(key, x); }
  const trend = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)).map((x) => ({ ...x, hours: Number(x.hours.toFixed(2)) }));
  const hourMap = new Map<number, number>(); for (const b of usable) { const h = Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(b.startAt)); hourMap.set(h, (hourMap.get(h) || 0) + 1); }
  const peakHours = [...hourMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hour, count]) => ({ hour, count }));

  const auditCount = await prisma.auditLog.count({ where: { resource: { in: ["MEETING_BOOKING", "MEETING_BOOKING_EVALUATION"] }, ...(from || to ? { createdAt: rangeFor(from, to) } : {}) } });

  return NextResponse.json({
    mode,
    filters: { from, to, roomId, departmentId, preparedById },
    masters: { rooms, departments, preparers },
    summary: { total, pending, approved, rejected, cancelled, completed, usedHours: Number(usedHours.toFixed(2)), attendeeCount, avgDurationHours: usable.length ? Number((usedHours / usable.length).toFixed(2)) : 0, evaluationCount: evaluations.length, responseRate, avgOverall: average("overallRating"), avgEquipment: average("equipmentReadiness"), avgCleanliness: average("cleanliness"), avgFacilitation: average("facilitationConvenience"), avgSuitability: average("roomSuitability"), avgApprovalHours, auditCount },
    preparation,
    rooms: roomReport,
    departments: departmentReport,
    requesters: requesterReport,
    individual: individualReport,
    approvers: approverReport,
    workload: workloadReport,
    equipment: equipmentReport,
    issues,
    rejectedReasons: [...rejectedReasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    trend,
    peakHours,
    bookings: bookings.slice(0, 500).map((b) => ({ publicId: b.publicId, title: b.title, room: b.room.nameTh, department: b.department?.nameTh || "ไม่ระบุ", requester: nameOf(b.requester), attendeeCount: b.attendeeCount, startAt: b.startAt.toISOString(), endAt: b.endAt.toISOString(), status: statusName[b.status] || b.status, cancellationReason: b.cancellationReason || "", approvedBy: b.approvedBy ? nameOf(b.approvedBy) : "-", preparedBy: b.preparedBy ? nameOf(b.preparedBy) : "ยังไม่มอบหมาย", preparationStatus: b.preparationStatus, evaluation: b.evaluation?.overallRating ?? null })),
  });
}
