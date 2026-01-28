import { useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Flame,
  TreePine,
  RotateCcw,
  Loader2,
  User,
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
import {
  prefixes,
  provinces,
  districts,
  subDistricts,
  fuelTypes,
  landUseTypes,
  approvalStatuses,
} from "@/data/mock-data";

interface FilterSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function FilterSection({
  filters,
  onFiltersChange,
  onReset,
  onSearch,
  isLoading = false,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const availableDistricts = filters.province
    ? districts[filters.province] || []
    : [];
  const availableSubDistricts = filters.district
    ? subDistricts[filters.district] || []
    : [];

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
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "ซ่อน" : "แสดง"}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Row 1: คำนำหน้า (1), ค้นหา (2), สถานะการอนุมัติ (1) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Prefix */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D32F2F]" />
                คำนำหน้า
              </label>
              <Select
                value={filters.prefix}
                onValueChange={(value) => updateFilter("prefix", value)}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกคำนำหน้า" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {prefixes.map((prefix) => (
                    <SelectItem key={prefix} value={prefix}>
                      {prefix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[#D32F2F] mb-2 block">
                ค้นหา (ชื่อ, นามสกุล, เบอร์โทร)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="พิมพ์คำค้นหา..."
                  value={filters.searchText}
                  onChange={(e) => updateFilter("searchText", e.target.value)}
                  className="pl-10 bg-muted/50 border-border focus:border-primary text-black placeholder:text-black"
                />
              </div>
            </div>

            {/* Approval Status */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 block">
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
          </div>

          {/* Row 2: จังหวัด, อำเภอ, ตำบล */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Province */}
            <div>
              <label className="text-sm font-medium text-[#5D4037] mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5D4037]" />
                จังหวัด
              </label>
              <Select
                value={filters.province}
                onValueChange={(value) => {
                  updateFilter("province", value);
                  updateFilter("district", "");
                  updateFilter("subDistrict", "");
                }}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div>
              <label className="text-sm font-medium text-[#5D4037] mb-2 block">
                อำเภอ
              </label>
              <Select
                value={filters.district}
                onValueChange={(value) => {
                  updateFilter("district", value);
                  updateFilter("subDistrict", "");
                }}
                disabled={!filters.province}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกอำเภอ" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {availableDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-District */}
            <div>
              <label className="text-sm font-medium text-[#5D4037] mb-2 block">
                ตำบล
              </label>
              <Select
                value={filters.subDistrict}
                onValueChange={(value) => updateFilter("subDistrict", value)}
                disabled={!filters.district}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกตำบล" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {availableSubDistricts.map((subDistrict) => (
                    <SelectItem key={subDistrict} value={subDistrict}>
                      {subDistrict}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: วันที่เริ่มต้น, วันที่สิ้นสุด, ชนิดเชื้อเพลิง, ประเภทการใช้ที่ดิน */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Land Use Type */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <TreePine className="w-4 h-4 text-[#D32F2F]" />
                ประเภทการใช้ที่ดิน
              </label>
              <Select
                value={filters.landUseType}
                onValueChange={(value) => updateFilter("landUseType", value)}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {landUseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="text-sm font-medium text-[#D32F2F] mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D32F2F]" />
                ชนิดเชื้อเพลิง
              </label>
              <Select
                value={filters.fuelType}
                onValueChange={(value) => updateFilter("fuelType", value)}
              >
                <SelectTrigger className="bg-muted/50 text-black">
                  <SelectValue placeholder="เลือกชนิดเชื้อเพลิง" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {fuelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
