export type Role = "ADMIN" | "EMPLOYEE" | "CUSTOMER";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  customerId: string | null;
  roleLabel?: string;
  home?: string;
};

export type Charge = {
  amount: number;
  formatted: string;
  isEstimate: boolean;
  durationMs: number;
  durationLabel: string;
  billedUnits: number;
  unitLabel: string;
};

export type Equipment = {
  id: string;
  number: string;
  name: string;
  type: string;
  status: string;
  rate: number;
  billingUnit: string;
  rateLabel: string;
  notes?: string | null;
  label: string;
  customerName?: string | null;
  latestJobId?: string;
  latestJobType?: string;
};

export type Person = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type Photo = {
  id: string;
  type: string;
  label: string;
  url: string;
  takenAt: string | null;
  notes?: string | null;
  uploadedByName?: string | null;
};

export type Rental = {
  id: string;
  status: string;
  destination: string | null;
  startAt: string | null;
  endAt: string | null;
  expectedPickupAt: string | null;
  rate: number;
  billingUnit: string;
  rateLabel: string;
  notes: string | null;
  charge: Charge;
  equipment: Equipment | null;
  customer: Person | null;
  photos?: Photo[];
  beforePhotos?: Photo[];
  afterPhotos?: Photo[];
  deliveredBy?: string | null;
  pickedUpBy?: string | null;
  conditionNotes?: string | null;
  delivery?: Job | null;
  pickupRequest?: Job | null;
  canConfirmDelivery?: boolean;
  canRequestPickup?: boolean;
};

export type Job = {
  id: string;
  type: string;
  title: string | null;
  startAt: string | null;
  completedAt: string | null;
  destination: string | null;
  notes: string | null;
  rentalId: string | null;
  source?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  customerConfirmedAt?: string | null;
  equipment: Equipment | null;
  customer: Person | null;
  employee: { id: string; name: string } | null;
  rental: Rental | null;
};

export type TimeEntry = {
  id: string;
  clockIn: string | null;
  clockOut: string | null;
  durationMs: number;
  durationLabel: string;
  running: boolean;
};

export type LocalPhoto = {
  uri: string;
  name: string;
  type: string;
};
