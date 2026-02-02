import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Flame, 
  TreePine, 
  Navigation,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from "lucide-react";
import { useState } from "react";
import { FuelRequest } from "@/types/fuel-request";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: FuelRequest;
  index: number;
}

const statusConfig = {
  pending: {
    label: "รออนุมัติ",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    label: "อนุมัติแล้วยังไม่รายงาน",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  reported: {
    label: "อนุมัติรายงานผลแล้ว",
    icon: FileCheck,
    className: "bg-info/10 text-info border-info/20",
  },
};

export function RequestCard({ request, index }: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusConfig[request.approvalStatus];
  const StatusIcon = status.icon;

  return (
    <div 
      className={cn(
        "card-elevated p-5 animate-fade-up opacity-0",
        `stagger-${(index % 4) + 1}`
      )}
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-forest rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {request.prefix}{request.firstName} {request.lastName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              {request.phone}
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("flex items-center gap-1.5", status.className)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </Badge>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">วันที่ส่งคำร้อง</p>
            <p className="text-sm font-medium text-foreground">{request.requestDate}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">พื้นที่</p>
            <p className="text-sm font-medium text-foreground">{request.district}, {request.province}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Flame className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">ชนิดเชื้อเพลิง</p>
            <p className="text-sm font-medium text-foreground">{request.fuelType}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <TreePine className="w-4 h-4 text-secondary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">พื้นที่ขอ</p>
            <p className="text-sm font-medium text-foreground">{request.requestedArea} ไร่</p>
          </div>
        </div>
      </div>

      {/* FireD Recommendation */}
      <div className="bg-muted/50 rounded-xl p-3 mb-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">คำแนะนำจาก FireD</p>
            <p className="text-sm text-foreground">{request.fireDRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4 mr-2" />
            ซ่อนรายละเอียด
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-2" />
            แสดงรายละเอียดเพิ่มเติม
          </>
        )}
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Details */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                ข้อมูลพื้นที่
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ตำบล</span>
                  <span className="text-foreground">{request.subDistrict}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ประเภทที่ดิน</span>
                  <span className="text-foreground">{request.landUseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">พิกัด</span>
                  <span className="text-foreground font-mono text-xs">
                    {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Details */}
            {(request.approvalStatus === "approved" || request.approvalStatus === "reported") && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  ข้อมูลการอนุมัติ
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ผู้อนุมัติ</span>
                    <span className="text-foreground">
                      {request.approverFirstName} {request.approverLastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เบอร์ติดต่อ</span>
                    <span className="text-foreground">{request.approverPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">พื้นที่อนุมัติ</span>
                    <span className="text-foreground">{request.approvedArea} ไร่</span>
                  </div>
                  {request.managementDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">วันที่จัดการ</span>
                      <span className="text-foreground">{request.managementDate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
