import type { QuoteStatus } from "./quote";
import type { BuildStatus } from "./build";
import type { ServiceStatus, ServiceType } from "./service";

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  workCount: number;
  totalSpent: number;
};

export type CustomerSearchResult = CustomerListItem;

export type CustomerOverviewQuote = {
  id: string;
  quoteNumber: number;
  title: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
};

export type CustomerOverviewService = {
  id: string;
  title: string;
  type: ServiceType;
  status: ServiceStatus;
  salePrice: number;
  profit: number;
  serviceDate: string;
};

export type CustomerOverviewSale = {
  id: string;
  soldAt: string;
  finalSalePrice: number;
  profit: number;
  buildName: string;
};

export type CustomerOverviewBuild = {
  id: string;
  name: string;
  status: BuildStatus;
  createdAt: string;
  salePrice: number | null;
};

export type CustomerDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  lookupKey: string;
  createdAt: string;
  workCount: number;
  totalSpent: number;
  quotes: CustomerOverviewQuote[];
  services: CustomerOverviewService[];
  builds: CustomerOverviewBuild[];
  sales: CustomerOverviewSale[];
};

export type CustomerOverview = {
  customerId: string | null;
  lookupKey: string;
  displayName: string;
  displayPhone: string;
  displayEmail: string | null;
  notes: string | null;
  quotes: CustomerOverviewQuote[];
  services: CustomerOverviewService[];
  builds: CustomerOverviewBuild[];
  sales: CustomerOverviewSale[];
};

export type CustomerFieldValue = {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
};
