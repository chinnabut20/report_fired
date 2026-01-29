"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { th } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Thai month names
const MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear();
  const fromYear = props.fromYear || currentYear - 10;
  const toYear = props.toYear || currentYear + 10;

  // Generate year options
  const years = React.useMemo(() => {
    const yearArray = [];
    for (let year = fromYear; year <= toYear; year++) {
      yearArray.push(year);
    }
    return yearArray;
  }, [fromYear, toYear]);

  // State for current displayed month
  const [month, setMonth] = React.useState<Date>(() => {
    const initialDate =
      props.defaultMonth || (props.selected as Date) || new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

  // State to track which dropdown is open (only one at a time)
  const [openDropdown, setOpenDropdown] = React.useState<
    "month" | "year" | null
  >(null);

  const handleMonthChange = (newMonth: string) => {
    const monthIndex = parseInt(newMonth, 10);
    setMonth(new Date(month.getFullYear(), monthIndex, 1));
    setOpenDropdown(null);
  };

  const handleYearChange = (newYear: string) => {
    const year = parseInt(newYear, 10);
    setMonth(new Date(year, month.getMonth(), 1));
    setOpenDropdown(null);
  };

  const handlePrevMonth = () => {
    setMonth((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setMonth((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newDate;
    });
  };

  // Handle DayPicker's onMonthChange - only update if triggered by DayPicker navigation
  const handleDayPickerMonthChange = (newMonth: Date) => {
    setMonth(new Date(newMonth.getFullYear(), newMonth.getMonth(), 1));
  };

  return (
    <div className={cn("p-3", className)}>
      {/* Custom Header with shadcn Select */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex gap-2 items-center">
          <Select
            value={month.getMonth().toString()}
            onValueChange={handleMonthChange}
            open={openDropdown === "month"}
            onOpenChange={(open) => setOpenDropdown(open ? "month" : null)}
          >
            <SelectTrigger className="h-8 w-[120px] text-sm font-medium">
              <SelectValue placeholder="เดือน" />
            </SelectTrigger>
            <SelectContent
              className="max-h-[200px] bg-card z-[9999]"
              position="popper"
              side="bottom"
              align="center"
              sideOffset={4}
            >
              {MONTHS.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={month.getFullYear().toString()}
            onValueChange={handleYearChange}
            open={openDropdown === "year"}
            onOpenChange={(open) => setOpenDropdown(open ? "year" : null)}
          >
            <SelectTrigger className="h-8 w-[90px] text-sm font-medium">
              <SelectValue placeholder="ปี" />
            </SelectTrigger>
            <SelectContent
              className="max-h-[200px] bg-card z-[9999]"
              position="popper"
              side="bottom"
              align="center"
              sideOffset={4}
            >
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year + 543}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* DayPicker without caption */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={month}
        onMonthChange={handleDayPickerMonthChange}
        locale={th}
        classNames={{
          months:
            "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden",
          nav: "hidden",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "text-primary font-bold",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
