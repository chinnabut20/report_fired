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
  dateFrom: undefined,
  dateTo: undefined,
  fuelType: "",
  landUseType: "",
};

// Map สถานะจากภาษาไทย (API) เป็น enum ภาษาอังกฤษ (Frontend)
const mapApprovalStatus = (
  statusText: string,
): FuelRequest["approvalStatus"] => {
  switch (statusText) {
    case "รออนุมัติ":
      return "pending";
    case "อนุมัติแล้วยังไม่รายงาน":
      return "approved";
    case "อนุมัติรายงานผลแล้ว":
      return "reported";
    case "ไม่อนุมัติ":
      return "rejected";
    default:
      return "pending";
  }
};

// Map สถานะจาก enum ภาษาอังกฤษ (Frontend) เป็นภาษาไทย (API)
const mapApprovalStatusToAPI = (status: string): string => {
  switch (status) {
    case "pending":
      return "รออนุมัติ";
    case "approved":
      return "อนุมัติแล้วยังไม่รายงาน";
    case "reported":
      return "อนุมัติรายงานผลแล้ว";
    case "rejected":
      return "ไม่อนุมัติ";
    default:
      return "";
  }
};

const Index = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<FuelRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Function สำหรับ fetch ข้อมูลจาก API
  const fetchData = async (filterParams: FilterState) => {
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
        params.append("burntype", filterParams.fuelType);
      if (filterParams.landUseType)
        params.append("burntypedes", filterParams.landUseType);
      if (filterParams.approvalStatus) {
        params.append(
          "status",
          mapApprovalStatusToAPI(filterParams.approvalStatus),
        );
      }
      if (filterParams.dateFrom) {
        params.append(
          "startDate",
          filterParams.dateFrom.toISOString().split("T")[0],
        );
      }
      if (filterParams.dateTo) {
        params.append(
          "endDate",
          filterParams.dateTo.toISOString().split("T")[0],
        );
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
        fuelType: item.burn_type || "",
        landUseType: item.burn_type_des || "",
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

      // Show success toast notification
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
    fetchData(initialFilters);
  }, []);

  const handleReset = () => {
    setFilters(initialFilters);
    fetchData(initialFilters);
  };

  const handleSearch = () => {
    fetchData(filters);
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
        <ResultsSection data={data} totalCount={totalCount} />
      </main>
    </div>
  );
};

export default Index;
