import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import VehiclesManager from "@/components/vehicles-manager";

export default async function VehiclesPage() {
  await requireAdmin();
  const vehicles = await prisma.vehicle.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return <VehiclesManager initialVehicles={vehicles.map((vehicle) => ({ id: vehicle.publicId, licensePlate: vehicle.licensePlate, brand: vehicle.brand, model: vehicle.model, color: vehicle.color, vehicleType: vehicle.vehicleType, note: vehicle.note, status: vehicle.status }))} />;
}
