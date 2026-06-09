export interface InventoryItem {
  id: string;
  tenantId: string;
  branchId?: string;
  macAddress: string;
  serialNumber: string;
  deviceType: string;
  status: 'NEW' | 'ASSIGNED' | 'RECOVERED' | 'USED' | 'REFURBISHED';
  assignedTo?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}