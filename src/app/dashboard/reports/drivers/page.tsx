import ReportClient from "../report-client";

export default function DriversReportPage() {
  return <ReportClient title="รายงานการปฏิบัติงาน พขร." description="สรุปจำนวนภารกิจ ผู้โดยสาร และผลการประเมินของพนักงานขับรถ" endpoint="/mycar/api/v1/reports/drivers" columns={[{ key: "firstName", label: "ชื่อ" }, { key: "lastName", label: "นามสกุล" }, { key: "nickname", label: "ชื่อเล่น" }, { key: "status", label: "สถานะ" }, { key: "tripCount", label: "จำนวนภารกิจ" }, { key: "completedCount", label: "เสร็จสิ้น" }, { key: "approvedCount", label: "อนุมัติ" }, { key: "cancelledCount", label: "ยกเลิก" }, { key: "passengers", label: "ผู้โดยสารรวม" }, { key: "evaluationCount", label: "จำนวนการประเมิน" }, { key: "averageRating", label: "คะแนนเฉลี่ย" }]} />;
}
