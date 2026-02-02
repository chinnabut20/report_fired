import { useState, useEffect } from "react";
import { FuelRequest } from "@/types/fuel-request";
import { Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
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
  dateFrom?: Date;
  dateTo?: Date;
}

const statusConfig = {
  pending: {
    label: "รออนุมัติ",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    label: "อนุมัติแล้วยังไม่รายงาน",
    className: "bg-success/10 text-success border-success/20",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  reported: {
    label: "อนุมัติรายงานผลแล้ว",
    className: "bg-info/10 text-info border-info/20",
  },
};

// Helper function สำหรับแปลงวันที่เป็น พ.ศ.
const formatDateThai = (date: Date, formatStr: string) => {
  const buddhistYear = date.getFullYear() + 543;
  const formatted = format(date, formatStr, { locale: th });
  // แทนที่ปี ค.ศ. ด้วย ปี พ.ศ.
  return formatted.replace(String(date.getFullYear()), String(buddhistYear));
};

// Helper function สำหรับแปลงวันที่เป็น พ.ศ. โดยทำให้ตัวเลขเป็นตัวหนา (return JSX)
const formatDateThaiWithBoldNumbers = (
  date: Date,
  formatStr: string,
  textColor: string,
) => {
  const buddhistYear = date.getFullYear() + 543;
  const formatted = format(date, formatStr, { locale: th });
  const formattedThai = formatted.replace(
    String(date.getFullYear()),
    String(buddhistYear),
  );

  // แยกส่วนที่เป็นตัวเลขและตัวอักษร
  const parts = formattedThai.split(/(\d+)/);

  return (
    <span style={{ color: textColor }} className="font-prompt">
      {parts.map((part, index) => {
        // ถ้าเป็นตัวเลข ให้ใส่ font-semibold
        if (/^\d+$/.test(part)) {
          return (
            <span key={index} className="font-semibold">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// Helper function สำหรับแปลงวันที่ที่เป็น string (DD/MM/YYYY) จาก ค.ศ. เป็น พ.ศ.
const convertDateStringToBuddhistYear = (
  dateStr: string | null | undefined,
): string => {
  if (!dateStr || dateStr === "-") return "-";

  // รูปแบบ DD/MM/YYYY
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const buddhistYear = parseInt(year) + 543;
    return `${day}/${month}/${buddhistYear}`;
  }

  return dateStr;
};

const prepareExportData = (data: FuelRequest[]) => {
  return data.map((item, index) => ({
    ลำดับ: index + 1,
    คำนำหน้า: item.prefix,
    ชื่อ: item.firstName,
    นามสกุล: item.lastName,
    เบอร์โทรศัพท์: item.phone,
    วันที่ส่งคำร้อง: convertDateStringToBuddhistYear(item.requestDate),
    จังหวัด: item.province,
    อำเภอ: item.district,
    ตำบล: item.subDistrict,
    ชนิดเชื้อเพลิง: item.fuelType,
    ประเภทการใช้ที่ดิน: item.landUseType,
    "ขนาดพื้นที่ที่ขอจัดการเชื้อเพลิง (ไร่)": item.requestedArea,
    ละติจูด: item.latitude.toFixed(4),
    ลองจิจูด: item.longitude.toFixed(4),
    "คำแนะนำในการอนุมัติ จากระบบ FireD": item.fireDRecommendation,
    "สถานะการอนุมัติ / การรายงานผลกลับ":
      statusConfig[item.approvalStatus].label,
    ชื่อผู้อนุมัติ: item.approverFirstName || "-",
    นามสกุลผู้อนุมัติ: item.approverLastName || "-",
    เบอร์โทรผู้อนุมัติ: item.approverPhone || "-",
    "ขนาดพื้นที่อนุมัติ (ไร่)": item.approvedArea || "-",
    วันที่จัดการเชื้อเพลิง: convertDateStringToBuddhistYear(
      item.managementDate,
    ),
  }));
};

export function ResultsSection({
  data,
  totalCount,
  dateFrom,
  dateTo,
}: ResultsSectionProps) {
  // สร้างชื่อไฟล์สำหรับ export โดยใช้วันที่เริ่มต้นและสิ้นสุดที่ผู้ใช้ค้นหา
  const getExportFileName = () => {
    const formatDateForFileName = (date: Date) => {
      return formatDateThai(date, "dd-MM-yyyy");
    };

    let fileName = "รายงานข้อมูลคำร้องขอจัดการเชื้อเพลิง";

    if (dateFrom && dateTo) {
      fileName += `_${formatDateForFileName(dateFrom)}_ถึง_${formatDateForFileName(dateTo)}`;
    } else if (dateFrom) {
      fileName += `_ตั้งแต่_${formatDateForFileName(dateFrom)}`;
    } else if (dateTo) {
      fileName += `_ถึง_${formatDateForFileName(dateTo)}`;
    }

    return fileName;
  };

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

    // Find the index of the status column (1-based for ExcelJS)
    const statusColumnIndex =
      headers.indexOf("สถานะการอนุมัติ / การรายงานผลกลับ") + 1;

    // Add data rows with status color
    exportData.forEach((row, rowIndex) => {
      const values = Object.keys(exportData[0] || {}).map(
        (h) => row[h as keyof typeof row],
      );
      const dataRow = worksheet.addRow(values);

      // Apply color to the status cell based on status value
      if (statusColumnIndex > 0) {
        const statusCell = dataRow.getCell(statusColumnIndex);
        const statusValue = row["สถานะการอนุมัติ / การรายงานผลกลับ"];

        let bgColor = "FFFFFFFF"; // Default white
        let textColor = "FF000000"; // Default black

        switch (statusValue) {
          case "รออนุมัติ":
            bgColor = "FFFFF3CD"; // Yellow background
            textColor = "FF856404"; // Dark yellow text
            break;
          case "อนุมัติแล้วยังไม่รายงาน":
            bgColor = "FFD4EDDA"; // Green background
            textColor = "FF155724"; // Dark green text
            break;
          case "ไม่อนุมัติ":
            bgColor = "FFF8D7DA"; // Red background
            textColor = "FF721C24"; // Dark red text
            break;
          case "อนุมัติรายงานผลแล้ว":
            bgColor = "FFD1ECF1"; // Blue background
            textColor = "FF0C5460"; // Dark blue text
            break;
        }

        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
        statusCell.font = {
          color: { argb: textColor },
          bold: true,
        };
        statusCell.alignment = { horizontal: "center", vertical: "middle" };
      }
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
    saveAs(blob, `${getExportFileName()}.xlsx`);
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
    link.download = `${getExportFileName()}.csv`;
    link.click();
  };

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  // Reset to page 1 when data changes (problem 1)
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Filter data based on search - search all columns (problem 3)
  const filteredData = data.filter((item, index) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    const status = statusConfig[item.approvalStatus];

    // Convert all displayed values to strings for searching (matching what's shown in table)
    // Note: ลำดับ in table uses globalIndex, but for search we use array index + 1
    const allValues = [
      String(index + 1), // ลำดับ (array index)
      item.prefix || "",
      item.firstName || "",
      item.lastName || "",
      item.phone || "",
      item.requestDate || "",
      item.province || "",
      item.district || "",
      item.subDistrict || "",
      item.fuelType || "",
      item.landUseType || "",
      String(item.requestedArea || ""),
      item.latitude != null ? item.latitude.toFixed(4) : "",
      item.longitude != null ? item.longitude.toFixed(4) : "",
      item.fireDRecommendation || "",
      status.label || "",
      item.approverFirstName || "",
      item.approverLastName || "",
      item.approverPhone || "",
      item.approvedArea != null ? String(item.approvedArea) : "",
      item.managementDate || "",
    ];

    // Search in all values - convert everything to lowercase and search
    // This ensures we find matches in any column regardless of data type
    return allValues.some((value) => {
      if (!value || value === "-") return false;
      // Convert to string and search case-insensitively
      return String(value).toLowerCase().includes(searchLower);
    });
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
                <p className="text-sm text-muted-foreground font-prompt">
                  {dateFrom && dateTo ? (
                    <>
                      <span
                        style={{ color: "#5D4037" }}
                        className="font-prompt font-semibold"
                      >
                        {formatDateThai(dateFrom, "d MMM yyyy")}
                      </span>{" "}
                      -{" "}
                      <span
                        style={{ color: "#D32F2F" }}
                        className="font-prompt font-semibold"
                      >
                        {formatDateThai(dateTo, "d MMM yyyy")}
                      </span>
                    </>
                  ) : dateFrom ? (
                    <span
                      style={{ color: "#5D4037" }}
                      className="font-prompt font-semibold"
                    >
                      {formatDateThai(dateFrom, "d MMM yyyy")}
                    </span>
                  ) : dateTo ? (
                    <span
                      style={{ color: "#D32F2F" }}
                      className="font-prompt font-semibold"
                    >
                      {formatDateThai(dateTo, "d MMM yyyy")}
                    </span>
                  ) : (
                    <>
                      พบ{" "}
                      <span className="font-semibold text-primary">
                        {data.length}
                      </span>{" "}
                      รายการ จากทั้งหมด {totalCount} รายการ
                    </>
                  )}
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
              <span className="text-sm text-muted-foreground font-['Comic_Sans_MS']">
                entries per page
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-['Comic_Sans_MS']">
                search
              </span>
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
                    ขนาดพื้นที่ที่ขอจัดการเชื้อเพลิง (ไร่)
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ละติจูด
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">
                    ลองจิจูด
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[200px]">
                    คำแนะนำในการอนุมัติ จากระบบ FireD
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[180px]">
                    สถานะการอนุมัติ / การรายงานผลกลับ
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
                  <TableHead className="font-semibold text-foreground min-w-[150px]">
                    ขนาดพื้นที่อนุมัติ (ไร่)
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
                      (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <TableRow key={request.id} className="hover:bg-muted/30">
                        <TableCell className="text-center">
                          {globalIndex}
                        </TableCell>
                        <TableCell>{request.prefix}</TableCell>
                        <TableCell>{request.firstName}</TableCell>
                        <TableCell>{request.lastName}</TableCell>
                        <TableCell>{request.phone}</TableCell>
                        <TableCell>
                          {convertDateStringToBuddhistYear(request.requestDate)}
                        </TableCell>
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
                        <TableCell>
                          {convertDateStringToBuddhistYear(
                            request.managementDate,
                          )}
                        </TableCell>
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
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-sm text-foreground">
              แสดงรายการที่{" "}
              <span className="font-semibold text-primary">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              ถึง{" "}
              <span className="font-semibold text-primary">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{" "}
              จากทั้งหมด{" "}
              <span className="font-semibold text-primary">
                {filteredData.length}
              </span>{" "}
              รายการ
              {filteredData.length < totalCount && (
                <>
                  {" "}
                  (กรองจากทั้งหมด{" "}
                  <span className="font-semibold text-primary">
                    {totalCount}
                  </span>{" "}
                  รายการ)
                </>
              )}
            </p>
            {filteredData.length > itemsPerPage ? (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2"
                >
                  «
                </Button>
                {/* Previous Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-2"
                >
                  ‹
                </Button>

                {/* Page Numbers */}
                {(() => {
                  const pages: (number | string)[] = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxVisiblePages / 2),
                  );
                  let endPage = Math.min(
                    totalPages,
                    startPage + maxVisiblePages - 1,
                  );

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }

                  return pages.map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "outline" : "ghost"}
                      size="sm"
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
                      }
                      className={cn(
                        "px-3 min-w-[36px]",
                        currentPage === page && "border-2 font-semibold",
                      )}
                    >
                      {page}
                    </Button>
                  ));
                })()}

                {/* Next Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-2"
                >
                  ›
                </Button>
                {/* Last Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2"
                >
                  »
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
