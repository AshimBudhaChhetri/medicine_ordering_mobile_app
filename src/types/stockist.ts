export interface Stockist {
  id: string;
  name: string;
  location: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockistInput {
  name: string;
  location: string;
}

