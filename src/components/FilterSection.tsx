import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Flame,
  TreePine,
  RotateCcw,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FilterState } from "@/types/fuel-request";
import burnTypeData from "@/data/burnType.json";
import burnTypeDesData from "@/data/burnTypeDes.json";

const approvalStatuses = [
  { value: "pending", label: "รอการอนุมัติ" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "rejected", label: "ไม่อนุมัติ" },
  { value: "reported", label: "รายงานผลแล้ว" },
];

// Types for JSON data
interface BurnType {
  LookupGroup: string;
  LookupType: string;
  LookupCode: string;
  LookupValue: string;
}

interface FilterSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  onSearch: () => void;
  isLoading?: boolean;
}

interface Province {
  id: number;
  prov_code: string;
  name_th: string;
  name_en: string;
}

interface District {
  id: number;
  amp_code: string;
  name_th: string;
  name_en: string;
  prov_namt: string;
}

interface SubDistrict {
  id: number;
  tam_code: string;
  name_th: string;
  name_en: string;
}

export function FilterSection({
  filters,
  onFiltersChange,
  onReset,
  onSearch,
  isLoading = false,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // State for boundary data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);

  // State to track selected items with codes
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null,
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null,
  );

  // Loading states for boundary dropdowns
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubDistricts, setIsLoadingSubDistricts] = useState(false);

  // State for land use type selection
  const [selectedLandUseType, setSelectedLandUseType] =
    useState<BurnType | null>(null);

  // Get filtered fuel types based on selected land use type's LookupGroup
  const filteredFuelTypes = selectedLandUseType
    ? (burnTypeDesData as BurnType[]).filter(
        (fuel) => fuel.LookupGroup === selectedLandUseType.LookupGroup,
      )
    : [];

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch("/api/boundary");
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setProvinces(data);
        } else {
          // invalid data handled silently or with minimal log if needed, but user asked to remove debug.
          // keeping it empty or just not logging data.
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        return;
      }

      setIsLoadingDistricts(true);
      try {
        const response = await fetch(
          `/api/boundary?prov_code=${selectedProvince.prov_code}`,
        );
        if (response.ok) {
          const data = await response.json();
          setDistricts(data);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Fetch sub-districts when district changes
  useEffect(() => {
    const fetchSubDistricts = async () => {
      if (!selectedProvince || !selectedDistrict) {
        setSubDistricts([]);
        return;
      }

      setIsLoadingSubDistricts(true);
      try {
        const response = await fetch(
          `/api/boundary?prov_code=${selectedProvince.prov_code}&amp_code=${selectedDistrict.amp_code}`,
        );
        if (response.ok) {
          const data = await response.json();
          setSubDistricts(data);
        }
      } catch (error) {
        console.error("Error fetching sub-districts:", error);
      } finally {
        setIsLoadingSubDistricts(false);
      }
    };
    fetchSubDistricts();
  }, [selectedProvince, selectedDistrict]);

  return (
    <div className="filter-card animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              ตัวกรองข้อมูล
            </h2>
            <p className="text-sm text-muted-foreground">
              กรองคำร้องขอจัดการเชื้อเพลิง
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            รีเซ็ต
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white"
          >
            {isExpanded ? "ซ่อน" : "แสดง"}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Row 1: จังหวัด, อำเภอ, ตำบล */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Province */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D32F2F]" />
                จังหวัด
                {isLoadingProvinces && (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E65100]" />
                )}
              </label>
              <Select
                value={filters.province}
                onValueChange={(value) => {
                  const province = provinces.find((p) => p.name_th === value);
                  setSelectedProvince(province || null);
                  setSelectedDistrict(null);
                  onFiltersChange({
                    ...filters,
                    province: value,
                    district: "",
                    subDistrict: "",
                  });
                }}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue
                    placeholder={
                      isLoadingProvinces ? "กำลังโหลด..." : "เลือกจังหวัด"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card z-[9999]" position="popper">
                  {provinces.map((province) => (
                    <SelectItem
                      key={province.prov_code}
                      value={province.name_th}
                    >
                      {province.name_th}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                อำเภอ
                {isLoadingDistricts && (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E65100]" />
                )}
              </label>
              <Select
                value={filters.district}
                onValueChange={(value) => {
                  const district = districts.find((d) => d.name_th === value);
                  setSelectedDistrict(district || null);
                  onFiltersChange({
                    ...filters,
                    district: value,
                    subDistrict: "",
                  });
                }}
                disabled={!filters.province || isLoadingDistricts}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue
                    placeholder={
                      isLoadingDistricts ? "กำลังโหลด..." : "เลือกอำเภอ"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card z-[9999]" position="popper">
                  {districts.map((district) => (
                    <SelectItem
                      key={district.amp_code}
                      value={district.name_th}
                    >
                      {district.name_th}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-District */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                ตำบล
                {isLoadingSubDistricts && (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E65100]" />
                )}
              </label>
              <Select
                value={filters.subDistrict}
                onValueChange={(value) => updateFilter("subDistrict", value)}
                disabled={!filters.district || isLoadingSubDistricts}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue
                    placeholder={
                      isLoadingSubDistricts ? "กำลังโหลด..." : "เลือกตำบล"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card z-[9999]" position="popper">
                  {subDistricts.map((subDistrict) => (
                    <SelectItem
                      key={subDistrict.tam_code}
                      value={subDistrict.name_th}
                    >
                      {subDistrict.name_th}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: ประเภทการใช้ที่ดิน, ชนิดเชื้อเพลิง */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Land Use Type */}
            <div>
              <label className="text-sm font-medium text-[#5D4037] mb-2 flex items-center gap-2">
                <TreePine className="w-4 h-4 text-[#5D4037]" />
                ประเภทการใช้ที่ดิน
              </label>
              <Select
                value={filters.landUseType}
                onValueChange={(value) => {
                  const landUseType = (burnTypeData as BurnType[]).find(
                    (t) => t.LookupValue === value,
                  );
                  setSelectedLandUseType(landUseType || null);
                  // Clear fuel type when land use type changes
                  onFiltersChange({
                    ...filters,
                    landUseType: value,
                    fuelType: "",
                  });
                }}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent className="bg-card z-[9999]" position="popper">
                  {(burnTypeData as BurnType[]).map((type) => (
                    <SelectItem key={type.LookupCode} value={type.LookupValue}>
                      {type.LookupValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="text-sm font-medium text-[#5D4037] mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#5D4037]" />
                ชนิดเชื้อเพลิง
              </label>
              <Select
                value={filters.fuelType}
                onValueChange={(value) => updateFilter("fuelType", value)}
                disabled={!filters.landUseType}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue
                    placeholder={
                      !filters.landUseType
                        ? "เลือกประเภทที่ดินก่อน"
                        : "เลือกชนิดเชื้อเพลิง"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card z-[9999]" position="popper">
                  {filteredFuelTypes.map((type) => (
                    <SelectItem key={type.LookupCode} value={type.LookupValue}>
                      {type.LookupValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: สถานะการอนุมัติ, วันที่เริ่มต้น, วันที่สิ้นสุด */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Approval Status */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D32F2F]" />
                สถานะการอนุมัติ
              </label>
              <Select
                value={filters.approvalStatus}
                onValueChange={(value) => updateFilter("approvalStatus", value)}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {approvalStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D32F2F]" />
                วันที่เริ่มต้น
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/50",
                      !filters.dateFrom && "text-black",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateFrom
                      ? format(filters.dateFrom, "d MMM yyyy", { locale: th })
                      : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 block">
                วันที่สิ้นสุด
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/50",
                      !filters.dateTo && "text-black",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateTo
                      ? format(filters.dateTo, "d MMM yyyy", { locale: th })
                      : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={onSearch}
              disabled={isLoading}
              className="gap-2 gradient-fire text-primary-foreground hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isLoading ? "กำลังค้นหา..." : "ค้นหา"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
