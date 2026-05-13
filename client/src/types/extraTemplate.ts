import type { MoneyValue } from "./part";

export type ExtraTemplateBrief = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  defaultCostPrice: number;
  defaultSalePrice: number;
};

export type ExtraTemplate = {
  id: string;
  name: string;
  description: string;
  defaultCostPrice: MoneyValue;
  defaultSalePrice: MoneyValue;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateExtraTemplatePayload = {
  name: string;
  description?: string | null;
  defaultCostPrice: number;
  defaultSalePrice: number;
  category?: string | null;
  active?: boolean;
};

export type PatchExtraTemplatePayload = Partial<CreateExtraTemplatePayload>;
