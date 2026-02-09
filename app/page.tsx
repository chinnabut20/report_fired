"use client";
import { useState, useEffect } from "react";
import { TreePine } from "lucide-react";
import { FilterSection } from "@/components/FilterSection";
import { ResultsSection } from "@/components/ResultsSection";
import { FilterState, FuelRequest } from "@/types/fuel-request";
import Swal from "sweetalert2";

const initialFilters: FilterState = {
  prefix: "",
  searchText: "",
  approvalStatus: "",
  province: "",
  district: "",
  subDistrict: "",
  dateFrom: new Date(new Date().getFullYear(), 0, 1), // Jan 1 of current year
  dateTo: new Date(), // Today
  fuelType: "",
  landUseType: "",
};

const mapApprovalStatus = (
  statusText: string,
): FuelRequest["approvalStatus"] => {
  switch (statusText) {
    case "รออนุมัติ":
      return "pending";
    case "อนุมัติแล้ว": // Case for "อนุมัติแล้ว" label if needed, or fallback
    case "อนุมัติแล้วยังไม่รายงาน":
      return "approved";
    case "รายงานผลแล้ว": // Case for "รายงานผลแล้ว" label if needed
    case "อนุมัติรายงานผลแล้ว":
      return "reported";
    case "ไม่อนุมัติ":
      return "rejected";
    default:
      return "pending";
  }
};

const mapApprovalStatusToAPI = (status: string): string => {
  return status;
};

const Index = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<FuelRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchId, setSearchId] = useState<number>(0);

  // Function สำหรับ fetch ข้อมูลจาก API
  const fetchData = async (
    filterParams: FilterState,
    showSuccessAlert = false,
  ) => {
    setIsSearching(true);
    try {
      // สร้าง query parameters
      const params = new URLSearchParams();

      if (filterParams.province)
        params.append("province", filterParams.province);
      if (filterParams.district)
        params.append("district", filterParams.district);
      if (filterParams.subDistrict)
        params.append("sub_district", filterParams.subDistrict);
      if (filterParams.fuelType)
        params.append("burntypedes", filterParams.fuelType);
      if (filterParams.landUseType)
        params.append("burntype", filterParams.landUseType);
      if (filterParams.approvalStatus) {
        params.append(
          "status",
          mapApprovalStatusToAPI(filterParams.approvalStatus),
        );
      }
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      if (filterParams.dateFrom) {
        params.append("startDate", formatDate(filterParams.dateFrom));
      }
      if (filterParams.dateTo) {
        params.append("endDate", formatDate(filterParams.dateTo));
      }

      const response = await fetch(`/api/filter?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const apiData = await response.json();

      // Map ข้อมูลจาก API response เป็น FuelRequest type
      const mappedData: FuelRequest[] = apiData.map((item: any) => ({
        id: String(item.id),
        prefix: item.title || "",
        firstName: item.firstname || "",
        lastName: item.lastname || "",
        phone: item.phone || "",
        requestDate: item.created_at || "",
        province: item.province || "",
        district: item.district || "",
        subDistrict: item.sub_district || "",
        // หมายเหตุ:
        // - burn_type      = ประเภทการใช้ที่ดิน (landUseType)
        // - burn_type_des  = ชนิดเชื้อเพลิง (fuelType)
        landUseType: item.burn_type || "",
        fuelType: item.burn_type_des || "",
        requestedArea: Number(item.burn_area) || 0,
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        fireDRecommendation: item.decision_text || "-",
        approvalStatus: mapApprovalStatus(item.status_text),
        approverFirstName: item.approve_by_firstname || undefined,
        approverLastName: item.approve_by_lastname || undefined,
        approverPhone: item.approve_by_phone
          ? String(item.approve_by_phone)
          : undefined,
        approvedArea: item.approve_burn_area
          ? Number(item.approve_burn_area)
          : undefined,
        managementDate: item.burn_date || undefined,
      }));

      // Filter ข้อมูลเพิ่มเติมสำหรับ prefix และ searchText (ที่ API ไม่รองรับ)
      let filteredData = mappedData;

      // Filter by prefix
      if (filterParams.prefix) {
        filteredData = filteredData.filter(
          (item) => item.prefix === filterParams.prefix,
        );
      }

      // Filter by search text (ชื่อ, นามสกุล, เบอร์โทร)
      if (filterParams.searchText) {
        const searchLower = filterParams.searchText.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.firstName.toLowerCase().includes(searchLower) ||
            item.lastName.toLowerCase().includes(searchLower) ||
            item.phone.includes(filterParams.searchText),
        );
      }

      setData(filteredData);
      setTotalCount(filteredData.length);

      // Show success toast notification only if requested
      if (showSuccessAlert) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "ค้นหาเสร็จสิ้น!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          customClass: {
            popup: "text-sm",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Load initial data เมื่อ component mount
  useEffect(() => {
    fetchData(initialFilters, false);
  }, []);

  const handleReset = () => {
    setFilters(initialFilters);
    setSearchId((prev) => prev + 1); // Trigger pagination reset
    fetchData(initialFilters, true);
  };

  const handleSearch = () => {
    setSearchId((prev) => prev + 1); // Trigger pagination reset
    fetchData(filters, true);
  };

  // Function สำหรับลบข้อมูล (soft delete)
  const handleDelete = async (id: string, name?: string) => {
    try {
      const response = await fetch(`/api/delete?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete data");
      }

      // Refresh ข้อมูลหลังจากลบสำเร็จ
      await fetchData(filters, false);

      // แสดง SweetAlert หลังจาก refresh เสร็จ
      Swal.fire({
        icon: "success",
        title: "ลบข้อมูลสำเร็จ",
        text: name
          ? `ลบคำร้องของ ${name} เรียบร้อยแล้ว`
          : "ลบข้อมูลเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#4CAF50",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Error deleting data:", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "เกิดข้อผิดพลาดในการลบข้อมูล",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  return (
    <div className="min-h-screen pb-2">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <img
              src="/logo.jpg"
              alt="FireD Logo"
              className="w-12 h-12 rounded-2xl shadow-lg object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-[#D32F2F] flex items-center gap-2 font-['Comic_Sans_MS'] tracking-wide">
                FireD
                <TreePine className="w-8 h-8 text-[#5D4037]" />
              </h1>
              <p className="text-sm text-[#5D4037]">
                ระบบรายงานข้อมูลคำร้องขอจัดการเชื้อเพลิง
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {/* Filter Section */}
        <FilterSection
          filters={filters}
          onFiltersChange={setFilters}
          onReset={handleReset}
          onSearch={handleSearch}
          isLoading={isSearching}
        />

        {/* Results Section */}
        <ResultsSection
          data={data}
          totalCount={totalCount}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDelete={handleDelete}
          searchId={searchId}
        />
      </main>
    </div>
  );
};

export default Index;
