import ReportClient from "../report-client";

export default function TripsReportPage() {
  return <ReportClient title="รายงานการใช้รถ / ภารกิจ" description="ตรวจสอบภารกิจตามแผนและผลการเดินทางจริง รวมเวลาและระยะทางจากบันทึก พขร." endpoint="/mycar/api/v1/reports/trips" columns={[{ key: "departureDate", label: "วันที่ออกเดินทาง" }, { key: "returnDate", label: "วันที่กลับ" }, { key: "requester", label: "ผู้ขอ" }, { key: "department", label: "หน่วยงาน" }, { key: "destination", label: "ปลายทาง" }, { key: "purpose", label: "วัตถุประสงค์" }, { key: "vehicle", label: "รถ" }, { key: "driver", label: "พขร." }, { key: "passengerCount", label: "ผู้โดยสาร" }, { key: "actualDepartureAt", label: "ออกจริง" }, { key: "actualReturnAt", label: "กลับจริง" }, { key: "distanceKm", label: "ระยะทาง (กม.)" }, { key: "status", label: "สถานะ" }]} />;
}
