import ReportClient from "../report-client";

export default function VehiclesReportPage() {
  return <ReportClient title="รายงานการใช้รถแยกรายคัน" description="เปรียบเทียบจำนวนเที่ยวและประวัติการใช้งานของรถแต่ละคัน" endpoint="/mycar/api/v1/reports/vehicles" columns={[{ key: "licensePlate", label: "ทะเบียน" }, { key: "brand", label: "ยี่ห้อ" }, { key: "model", label: "รุ่น" }, { key: "status", label: "สถานะรถ" }, { key: "tripCount", label: "จำนวนเที่ยว" }, { key: "completedCount", label: "เสร็จสิ้น" }, { key: "approvedCount", label: "อนุมัติ" }, { key: "cancelledCount", label: "ยกเลิก" }, { key: "passengers", label: "ผู้โดยสารรวม" }]} />;
}
