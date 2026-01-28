export interface FuelRequest {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  phone: string;
  requestDate: string;
  province: string;
  district: string;
  subDistrict: string;
  fuelType: string;
  landUseType: string;
  requestedArea: number;
  latitude: number;
  longitude: number;
  fireDRecommendation: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reported';
  approverFirstName?: string;
  approverLastName?: string;
  approverPhone?: string;
  approvedArea?: number;
  managementDate?: string;
}

export interface FilterState {
  prefix: string;
  searchText: string;
  approvalStatus: string;
  province: string;
  district: string;
  subDistrict: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  fuelType: string;
  landUseType: string;
}
