export interface GPSTrackingPoint {
  id: string;
  tenantId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
}

export interface CheckInLocation {
  id: string;
  tenantId: string;
  userId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  checkIns: Array<{
    id: string;
    timestamp: Date;
    photoUrl?: string;
  }>;
}

export interface OfflineSyncQueue {
  id: string;
  tenantId: string;
  userId: string;
  action: 'CHECK_IN' | 'COLLECT_CASH' | 'UPDATE_INVENTORY';
  data: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  createdAt: Date;
  syncedAt?: Date;
}