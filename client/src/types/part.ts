export const PART_CATEGORIES = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "STORAGE",
  "PSU",
  "CASE",
  "COOLER",
  "FAN",
  "NETWORK",
  "OTHER"
] as const;

export const PART_CONDITIONS = ["NEW", "USED", "REFURBISHED"] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];
export type PartCondition = (typeof PART_CONDITIONS)[number];
export type MoneyValue = number | string;

export type Part = {
  id: string;
  name: string;
  category: PartCategory;
  condition: PartCondition;
  costPrice: MoneyValue;
  salePrice: MoneyValue;
  stock: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartFormValues = {
  name: string;
  category: PartCategory;
  condition: PartCondition;
  costPrice: number;
  stock: number;
  notes: string;
};

export type PartPayload = Omit<PartFormValues, "notes"> & {
  notes?: string | null;
};
