"use client";
import { useState, useMemo } from "react";
import { Flame, TreePine } from "lucide-react";
import { FilterSection } from "@/components/FilterSection";
import { ResultsSection } from "@/components/ResultsSection";
import { FilterState, FuelRequest } from "@/types/fuel-request";
import { mockData } from "@/data/mock-data";
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

const Index = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      // Prefix filter
      if (appliedFilters.prefix && item.prefix !== appliedFilters.prefix)
        return false;

      // Search text filter
      if (appliedFilters.searchText) {
        const searchLower = appliedFilters.searchText.toLowerCase();
        const matchesSearch =
          item.firstName.toLowerCase().includes(searchLower) ||
          item.lastName.toLowerCase().includes(searchLower) ||
          item.phone.includes(appliedFilters.searchText);
        if (!matchesSearch) return false;
      }

      // Approval status filter
      if (
        appliedFilters.approvalStatus &&
        item.approvalStatus !== appliedFilters.approvalStatus
      )
        return false;

      // Province filter
      if (appliedFilters.province && item.province !== appliedFilters.province)
        return false;

      // District filter
      if (appliedFilters.district && item.district !== appliedFilters.district)
        return false;

      // Sub-district filter
      if (
        appliedFilters.subDistrict &&
        item.subDistrict !== appliedFilters.subDistrict
      )
        return false;

      // Date range filter
      if (appliedFilters.dateFrom || appliedFilters.dateTo) {
        const itemDate = new Date(item.requestDate);
        if (appliedFilters.dateFrom && itemDate < appliedFilters.dateFrom)
          return false;
        if (appliedFilters.dateTo && itemDate > appliedFilters.dateTo)
          return false;
      }

      // Fuel type filter
      if (appliedFilters.fuelType && item.fuelType !== appliedFilters.fuelType)
        return false;

      // Land use type filter
      if (
        appliedFilters.landUseType &&
        item.landUseType !== appliedFilters.landUseType
      )
        return false;

      return true;
    });
  }, [appliedFilters]);

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate loading delay (in real system, this would be an API call)
    setTimeout(() => {
      setAppliedFilters(filters);
      setIsSearching(false);

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
    }, 800);
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
                ระบบกรองข้อมูลคำร้องขอจัดการเชื้อเพลิง
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
        <ResultsSection data={filteredData} totalCount={mockData.length} />
      </main>
    </div>
  );
};

export default Index;
