export interface CatalogOption {
  id: string;
  name: string;
}

export interface CatalogOptions {
  units: CatalogOption[];
  types: CatalogOption[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  unitId: string;
  unit: string;
  typeId: string;
  type: string;
  mrp: string;
  sales: string;
  price: string;
  batch: string;
  expiry: string;
  amount: number;
  remarks?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  name?: string;
  batch?: string;
}

