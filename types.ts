
export interface PlateRecord {
  id: string;
  plateNumber: string;
  category: string;
  plateType: string;
  quantity: string;
  reportNumber: string;
  seizureDate: string;
  trafficSupplyDate: string;
  vehicleModel: string;
  supplyingEntity: string;
  seizedItems: string;
  actionsTaken: string;
  entryDate: string;
  status: 'COMPLETED'; // تبسيط الحالة
  notes?: string;
}
