import { prisma } from "../src/lib/prisma";
import { randomUUID } from "node:crypto";
async function main() {
  const rooms = [
    ["MR-001", "ห้องประชุมใหญ่", "อาคารอำนวยการ ชั้น 2", 40, "ห้องประชุมหลักสำหรับการประชุมขนาดใหญ่"],
    ["MR-002", "ห้องประชุมเล็ก 1", "อาคารอำนวยการ ชั้น 1", 12, "ห้องประชุมสำหรับกลุ่มงานขนาดเล็ก"],
    ["MR-003", "ห้องประชุมเล็ก 2", "อาคารอำนวยการ ชั้น 1", 12, "ห้องประชุมสำหรับกลุ่มงานขนาดเล็ก"],
  ] as const;
  const equipment = [
    ["PROJECTOR", "โปรเจกเตอร์"], ["MICROPHONE", "ไมโครโฟน"], ["SPEAKER", "เครื่องเสียง"],
    ["TV", "จอทีวี"], ["VIDEO_CONFERENCE", "ระบบประชุมทางไกล"], ["NOTEBOOK", "Notebook"],
  ] as const;
  for (const [code, nameTh] of equipment) await prisma.meetingEquipment.upsert({ where: { code }, update: { nameTh, status: "ACTIVE" }, create: { id: randomUUID(), publicId: randomUUID(), code, nameTh, status: "ACTIVE", updatedAt: new Date() } });
  for (const [code, nameTh, location, capacity, description] of rooms) await prisma.meetingRoom.upsert({ where: { code }, update: { nameTh, location, capacity, description, status: "ACTIVE", deletedAt: null, updatedAt: new Date() }, create: { id: randomUUID(), publicId: randomUUID(), code, nameTh, location, capacity, description, status: "ACTIVE", updatedAt: new Date() } });
  console.log(`Meeting rooms: ${await prisma.meetingRoom.count()}`);
  console.log(`Meeting equipment: ${await prisma.meetingEquipment.count()}`);
}
main();
