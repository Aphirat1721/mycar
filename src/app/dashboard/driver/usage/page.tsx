import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DriverUsageClient from "@/components/driver-usage-client";

type DecimalLike = { toString(): string };
type FuelUsage = { id: string; publicId: string; vehicleUsageLogId: string; createdAt: Date; updatedAt: Date; fuelType: string; liters: DecimalLike; pricePerLiter?: DecimalLike | null; amount: DecimalLike; receiptNo: string | null; note: string | null };
type ExpenseUsage = { id: string; publicId: string; vehicleUsageLogId: string; createdAt: Date; updatedAt: Date; type: string; amount: DecimalLike; detail: string | null; receiptNo: string | null; evidencePath: string | null };
type UsageLog = { fuelEntries: FuelUsage[]; expenses: ExpenseUsage[] };

function plainUsage(log: UsageLog | null) {
  if (!log) return null;
  return {
    ...log,
    fuelEntries: log.fuelEntries.map((x) => ({ ...x, liters: x.liters.toString(), pricePerLiter: x.pricePerLiter?.toString() ?? null, amount: x.amount.toString(), receiptNo: x.receiptNo ?? "", note: x.note ?? "" })),
    expenses: log.expenses.map((x) => ({ ...x, amount: x.amount.toString(), detail: x.detail ?? "", receiptNo: x.receiptNo ?? "", evidencePath: x.evidencePath ?? "" })),
  };
}

export default async function DriverUsagePage() {
  const user = await requireUser();
  const driver = await prisma.driver.findUnique({ where: { userId: user.id }, select: { id: true, firstName: true, lastName: true, nickname: true, status: true, deletedAt: true } });
  if (!driver || driver.status !== "ACTIVE" || driver.deletedAt) redirect("/dashboard");
  const assignments = await prisma.vehicleRequest.findMany({
    where: { driverId: driver.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
    orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
    include: { requester: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } }, department: { select: { code: true, nameTh: true } }, vehicle: { select: { licensePlate: true, brand: true, model: true, color: true } }, usageLog: { include: { fuelEntries: true, expenses: true } } },
  });
  return <DriverUsageClient driver={driver} initialAssignments={assignments.map((item) => ({ ...item, usageLog: plainUsage(item.usageLog) }))} />;
}
