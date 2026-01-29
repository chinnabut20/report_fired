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
  ChevronsUpDown,
  Check,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FilterState } from "@/types/fuel-request";
import burnTypeData from "@/data/burnType.json";
import burnTypeDesData from "@/data/burnTypeDes.json";

const approvalStatuses = [
  { value: "รออนุมัติ", label: "รอการอนุมัติ" },
  { value: "อนุมัติแล้วยังไม่รายงาน", label: "อนุมัติแล้ว" },
  { value: "อนุมัติรายงานผลแล้ว", label: "รายงานผลแล้ว" },
  { value: "ไม่อนุมัติ", label: "ไม่อนุมัติ" },
  { value: "อนุมัติทั้งหมด", label: "อนุมัติทั้งหมด" },
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

  // State for controlling date popover open/close
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);

  // State for controlling combobox popover open/close
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isSubDistrictOpen, setIsSubDistrictOpen] = useState(false);

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
            {/* Province - Searchable Combobox */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D32F2F]" />
                จังหวัด
                {isLoadingProvinces && (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E65100]" />
                )}
              </label>
              <Popover open={isProvinceOpen} onOpenChange={setIsProvinceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isProvinceOpen}
                    className="w-full justify-between bg-muted/50 text-black font-normal"
                  >
                    {filters.province ||
                      (isLoadingProvinces ? "กำลังโหลด..." : "เลือกจังหวัด")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 bg-card z-[9999]"
                  align="start"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="ค้นหาจังหวัด..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบจังหวัด</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__all__"
                          onSelect={() => {
                            setSelectedProvince(null);
                            setSelectedDistrict(null);
                            onFiltersChange({
                              ...filters,
                              province: "",
                              district: "",
                              subDistrict: "",
                            });
                            setIsProvinceOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !filters.province ? "opacity-100" : "opacity-0",
                            )}
                          />
                          ทั้งหมด
                        </CommandItem>
                        {provinces.map((province) => (
                          <CommandItem
                            key={province.prov_code}
                            value={province.name_th}
                            onSelect={() => {
                              setSelectedProvince(province);
                              setSelectedDistrict(null);
                              onFiltersChange({
                                ...filters,
                                province: province.name_th,
                                district: "",
                                subDistrict: "",
                              });
                              setIsProvinceOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.province === province.name_th
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {province.name_th}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* District - Searchable Combobox */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                อำเภอ
                {isLoadingDistricts && (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E65100]" />
                )}
              </label>
              <Popover open={isDistrictOpen} onOpenChange={setIsDistrictOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isDistrictOpen}
                    disabled={!filters.province || isLoadingDistricts}
                    className="w-full justify-between bg-muted/50 text-black font-normal"
                  >
                    {filters.district ||
                      (isLoadingDistricts ? "กำลังโหลด..." : "เลือกอำเภอ")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 bg-card z-[9999]"
                  align="start"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="ค้นหาอำเภอ..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบอำเภอ</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__all__"
                          onSelect={() => {
                            setSelectedDistrict(null);
                            onFiltersChange({
                              ...filters,
                              district: "",
                              subDistrict: "",
                            });
                            setIsDistrictOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !filters.district ? "opacity-100" : "opacity-0",
                            )}
                          />
                          ทั้งหมด
                        </CommandItem>
                        {districts.map((district) => (
                          <CommandItem
                            key={district.amp_code}
                            value={district.name_th}
                            onSelect={() => {
                              setSelectedDistrict(district);
                              onFiltersChange({
                                ...filters,
                                district: district.name_th,
                                subDistrict: "",
                              });
                              setIsDistrictOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.district === district.name_th
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {district.name_th}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sub-District - Searchable Combobox */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                ตำบล
                {isLoadingSubDistricts && (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E65100]" />
                )}
              </label>
              <Popover
                open={isSubDistrictOpen}
                onOpenChange={setIsSubDistrictOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSubDistrictOpen}
                    disabled={!filters.district || isLoadingSubDistricts}
                    className="w-full justify-between bg-muted/50 text-black font-normal"
                  >
                    {filters.subDistrict ||
                      (isLoadingSubDistricts ? "กำลังโหลด..." : "เลือกตำบล")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 bg-card z-[9999]"
                  align="start"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="ค้นหาตำบล..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบตำบล</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__all__"
                          onSelect={() => {
                            updateFilter("subDistrict", "");
                            setIsSubDistrictOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !filters.subDistrict
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          ทั้งหมด
                        </CommandItem>
                        {subDistricts.map((subDistrict) => (
                          <CommandItem
                            key={subDistrict.tam_code}
                            value={subDistrict.name_th}
                            onSelect={() => {
                              updateFilter("subDistrict", subDistrict.name_th);
                              setIsSubDistrictOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.subDistrict === subDistrict.name_th
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {subDistrict.name_th}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                value={filters.landUseType || "__all__"}
                onValueChange={(value) => {
                  const actualValue = value === "__all__" ? "" : value;
                  const landUseType = (burnTypeData as BurnType[]).find(
                    (t) => t.LookupValue === actualValue,
                  );
                  setSelectedLandUseType(landUseType || null);
                  // Clear fuel type when land use type changes
                  onFiltersChange({
                    ...filters,
                    landUseType: actualValue,
                    fuelType: "",
                  });
                }}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent className="bg-card z-[9999]" position="popper">
                  <SelectItem value="__all__">ทั้งหมด</SelectItem>
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
                value={filters.fuelType || "__all__"}
                onValueChange={(value) => {
                  const actualValue = value === "__all__" ? "" : value;
                  updateFilter("fuelType", actualValue);
                }}
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
                  <SelectItem value="__all__">ทั้งหมด</SelectItem>
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
                value={filters.approvalStatus || "__all__"}
                onValueChange={(value) => {
                  const actualValue = value === "__all__" ? "" : value;
                  updateFilter("approvalStatus", actualValue);
                }}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="__all__">ทั้งหมด</SelectItem>
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
                วันที่เริ่มต้นจัดการเชื้อเพลิง
              </label>
              <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
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
                    onSelect={(date) => {
                      updateFilter("dateFrom", date);
                      setIsDateFromOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 block">
                วันที่สิ้นสุดการจัดการเชื้อเพลิง
              </label>
              <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
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
                    onSelect={(date) => {
                      updateFilter("dateTo", date);
                      setIsDateToOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              รีเซ็ต
            </Button>
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
