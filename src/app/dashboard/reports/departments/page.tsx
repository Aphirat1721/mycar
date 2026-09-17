import ReportClient from "../report-client";

export default function DepartmentsReportPage() {
  return <ReportClient title="รายงานการใช้รถแยกหน่วยงาน" description="เปรียบเทียบการขอใช้รถและจำนวนผู้โดยสารของแต่ละหน่วยงาน" endpoint="/mycar/api/v1/reports/departments" columns={[{ key: "code", label: "รหัสหน่วยงาน" }, { key: "nameTh", label: "หน่วยงาน" }, { key: "requestCount", label: "คำขอทั้งหมด" }, { key: "pendingCount", label: "รอพิจารณา" }, { key: "approvedCount", label: "อนุมัติ" }, { key: "rejectedCount", label: "ไม่อนุมัติ" }, { key: "cancelledCount", label: "ยกเลิก" }, { key: "completedCount", label: "เสร็จสิ้น" }, { key: "passengers", label: "ผู้โดยสารรวม" }]} />;
}
