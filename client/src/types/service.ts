import type { Part } from "./part";
import type { ExtraTemplateBrief } from "./extraTemplate";

export const SERVICE_TYPES = [
  "SPARE_PART_SALE",
  "PC_CLEANING",
  "FORMATTING",
  "OS_INSTALLATION",
  "DIAGNOSTIC",
  "THERMAL_PASTE_CHANGE",
  "PARTIAL_ASSEMBLY",
  "HOME_SERVICE",
  "OTHER"
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_STATUSES = ["PENDING", "COMPLETED", "CANCELLED"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export type ServiceSparePartLineRow = {
  id: string;
  serviceId: string;
  partId: string;
  quantity: number;
  part: Part;
};

export type ServiceExtraLineRow = {
  id: string;
  serviceId: string;
  extraTemplateId: string | null;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitSalePrice: number;
  extraTemplate: ExtraTemplateBrief | null;
};

export type ServiceRow = {
  id: string;
  type: ServiceType;
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  description: string;
  selectedPartId: string | null;
  quantity: number | null;
  costPrice: number;
  salePrice: number;
  profit: number;
  isHomeService: boolean;
  homeServiceAddress: string | null;
  homeServiceSupplement: number | null;
  serviceDate: string;
  status: ServiceStatus;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  selectedPart: Part | null;
  sparePartLines?: ServiceSparePartLineRow[];
  extraLines?: ServiceExtraLineRow[];
};

export type MonthlyServiceSummaryRow = {
  month: number;
  year: number;
  servicesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
};

export type SparePartLinePayload = {
  partId: string;
  quantity: number;
};

export type ServiceExtraLinePayload = {
  extraTemplateId: string;
  quantity?: number;
  unitCost?: number;
  unitSalePrice?: number;
};

export type CreateServicePayload = {
  type: ServiceType;
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  description?: string;
  selectedPartId?: string | null;
  quantity?: number | null;
  sparePartLines?: SparePartLinePayload[];
  extraLines?: ServiceExtraLinePayload[];
  costPrice?: number;
  salePrice?: number;
  isHomeService?: boolean;
  homeServiceAddress?: string | null;
  homeServiceSupplement?: number | null;
  serviceDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
};

export type PatchServicePayload = Partial<
  Omit<CreateServicePayload, "serviceDate"> & { serviceDate?: string; status?: ServiceStatus }
>;

export type PatchServiceExtraLinePayload = {
  quantity?: number;
  unitCost?: number;
  unitSalePrice?: number;
};
