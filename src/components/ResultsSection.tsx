import { useState } from "react";
import { FuelRequest } from "@/types/fuel-request";
import { Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ResultsSectionProps {
  data: FuelRequest[];
  totalCount: number;
}

const statusConfig = {
  pending: {
    label: "รอการอนุมัติ",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    label: "อนุมัติแล้ว",
    className: "bg-success/10 text-success border-success/20",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  reported: {
    label: "รายงานผลแล้ว",
    className: "bg-info/10 text-info border-info/20",
  },
};

const prepareExportData = (data: FuelRequest[]) => {
  return data.map((item) => ({
    ลำดับ: item.id,
    คำนำหน้า: item.prefix,
    ชื่อ: item.firstName,
    นามสกุล: item.lastName,
    เบอร์โทรศัพท์: item.phone,
    วันที่ส่งคำร้อง: item.requestDate,
    จังหวัด: item.province,
    อำเภอ: item.district,
    ตำบล: item.subDistrict,
    ชนิดเชื้อเพลิง: item.fuelType,
    ประเภทการใช้ที่ดิน: item.landUseType,
    "พื้นที่ขอ (ไร่)": item.requestedArea,
    ละติจูด: item.latitude,
    ลองจิจูด: item.longitude,
    "คำแนะนำ FireD": item.fireDRecommendation,
    สถานะการอนุมัติ: statusConfig[item.approvalStatus].label,
    ชื่อผู้อนุมัติ: item.approverFirstName || "-",
    นามสกุลผู้อนุมัติ: item.approverLastName || "-",
    เบอร์โทรผู้อนุมัติ: item.approverPhone || "-",
    "พื้นที่อนุมัติ (ไร่)": item.approvedArea || "-",
    วันที่จัดการเชื้อเพลิง: item.managementDate || "-",
  }));
};

export function ResultsSection({ data, totalCount }: ResultsSectionProps) {
  const handleDownloadXLSX = async () => {
    const exportData = prepareExportData(data);
    const headers = Object.keys(exportData[0] || {});

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ข้อมูลคำร้อง");

    // Add header row
    worksheet.addRow(headers);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" }, // Green background
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" }, // White text
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    exportData.forEach((row) => {
      const values = Object.keys(exportData[0] || {}).map(
        (h) => row[h as keyof typeof row],
      );
      worksheet.addRow(values);
    });

    // Auto-fit column widths
    worksheet.columns.forEach((column, index) => {
      const header = headers[index];
      let maxLength = header.length;
      exportData.forEach((row) => {
        const value = String(row[header as keyof typeof row] || "");
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = Math.min(maxLength + 2, 40);
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "fuel_requests.xlsx");
  };

  const handleDownloadCSV = () => {
    const exportData = prepareExportData(data);
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "fuel_requests.csv";
    link.click();
  };

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  // Filter data based on search
  const filteredData = data.filter((item) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      item.firstName?.toLowerCase().includes(searchLower) ||
      item.lastName?.toLowerCase().includes(searchLower) ||
      item.phone?.includes(searchText) ||
      item.province?.toLowerCase().includes(searchLower) ||
      item.district?.toLowerCase().includes(searchLower) ||
      item.subDistrict?.toLowerCase().includes(searchLower) ||
      item.fuelType?.toLowerCase().includes(searchLower) ||
      item.landUseType?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Reset to page 1 when data changes
  const handlePageReset = () => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  };

  return (
    <div className="mt-8">
      <Card className="filter-card p-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D32F2F] rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  ผลลัพธ์การค้นหา
                </h2>
                <p className="text-sm text-muted-foreground">
                  พบ{" "}
                  <span className="font-semibold text-primary">
                    {data.length}
                  </span>{" "}
                  รายการ จากทั้งหมด {totalCount} รายการ
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadXLSX}
                className="gap-2"
                disabled={data.length === 0}
              >
                <Download className="w-4 h-4" />
                XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                className="gap-2"
                disabled={data.length === 0}
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Table Controls: Entries per page + Search */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px] bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                entries per page
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <div className="relative">
                <Input
                  placeholder="ค้นหา..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-[200px] bg-muted/50"
                />
              </div>
            </div>
          </div>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table className="font-prompt">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground min-w-[50px] font-prompt">
                    ลำดับ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[80px] font-prompt">
                    คำนำหน้า
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ชื่อ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    นามสกุล
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[120px]">
                    เบอร์โทรศัพท์
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[120px]">
                    วันที่ส่งคำร้อง
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    จังหวัด
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    อำเภอ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ตำบล
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[120px]">
                    ชนิดเชื้อเพลิง
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[140px]">
                    ประเภทการใช้ที่ดิน
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    พื้นที่ขอ (ไร่)
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ละติจูด
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ลองจิจูด
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[200px]">
                    คำแนะนำ FireD
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[130px]">
                    สถานะการอนุมัติ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ชื่อผู้อนุมัติ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[120px]">
                    นามสกุลผู้อนุมัติ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[130px]">
                    เบอร์โทรผู้อนุมัติ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[120px]">
                    พื้นที่อนุมัติ (ไร่)
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[140px]">
                    วันที่จัดการเชื้อเพลิง
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((request, index) => {
                    const status = statusConfig[request.approvalStatus];
                    const globalIndex =
                      (currentPage - 1) * itemsPerPage + index;
                    return (
                      <TableRow key={request.id} className="hover:bg-muted/30">
                        <TableCell className="text-center">
                          {request.id}
                        </TableCell>
                        <TableCell>{request.prefix}</TableCell>
                        <TableCell>{request.firstName}</TableCell>
                        <TableCell>{request.lastName}</TableCell>
                        <TableCell>{request.phone}</TableCell>
                        <TableCell>{request.requestDate}</TableCell>
                        <TableCell>{request.province}</TableCell>
                        <TableCell>{request.district}</TableCell>
                        <TableCell>{request.subDistrict}</TableCell>
                        <TableCell>{request.fuelType}</TableCell>
                        <TableCell>{request.landUseType}</TableCell>
                        <TableCell className="text-center">
                          {request.requestedArea}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.latitude.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.longitude.toFixed(4)}
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate"
                          title={request.fireDRecommendation}
                        >
                          {request.fireDRecommendation}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", status.className)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.approverFirstName || "-"}
                        </TableCell>
                        <TableCell>{request.approverLastName || "-"}</TableCell>
                        <TableCell>{request.approverPhone || "-"}</TableCell>
                        <TableCell className="text-center">
                          {request.approvedArea || "-"}
                        </TableCell>
                        <TableCell>{request.managementDate || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={21}
                      className="h-32 text-center text-muted-foreground"
                    >
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Pagination Controls */}
          {filteredData.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-sm text-muted-foreground">
                แสดงรายการที่ {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)}{" "}
                จากทั้งหมด {filteredData.length} รายการ
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  ก่อนหน้า
                </Button>
                <span className="text-sm font-medium px-3">
                  หน้า {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  ถัดไป
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
