import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { stockistService } from "../services/stockistService";
import { CreateStockistInput, Stockist } from "../types/stockist";
import { useAuth } from "./AuthContext";

export interface StockistApprovalRequest {
  id: string;
  name: string;
  location: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  submittedDate: string;
  status: "PENDING" | "REJECTED";
  rejectionReason?: string;
}

export type StockistContextType = {
  stockists: Stockist[];
  /** Alias for stockists to support existing screens seamlessly */
  approvedStockists: Stockist[];
  approvalRequests: StockistApprovalRequest[];
  isLoading: boolean;
  error: string | null;
  refreshStockists: () => Promise<void>;
  addStockist: (input: CreateStockistInput) => Promise<Stockist>;
  /** Compatible signature with previous mock implementation */
  addStockistRequest: (stockist: {
    name: string;
    location?: string;
    address?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) => Promise<Stockist>;
};

const StockistContext = createContext<StockistContextType | undefined>(
  undefined
);

export function StockistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [stockists, setStockists] = useState<Stockist[]>([]);
  const [approvalRequests] = useState<StockistApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockists = useCallback(async () => {
    if (!isAuthenticated) {
      setStockists([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await stockistService.getStockists();
      setStockists(data);
    } catch (err: any) {
      console.warn("Failed to load stockists:", err);
      setError(err?.message || "Failed to load stockists");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStockists();
    } else {
      setStockists([]);
    }
  }, [isAuthenticated, fetchStockists]);

  const addStockist = async (input: CreateStockistInput): Promise<Stockist> => {
    const newStockist = await stockistService.createStockist(input);
    setStockists((prev) => [newStockist, ...prev]);
    return newStockist;
  };

  const addStockistRequest = async (form: {
    name: string;
    location?: string;
    address?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }): Promise<Stockist> => {
    const loc = form.location?.trim() || form.address?.trim() || "Location not specified";
    return addStockist({
      name: form.name.trim(),
      location: loc,
    });
  };

  return (
    <StockistContext.Provider
      value={{
        stockists,
        approvedStockists: stockists,
        approvalRequests,
        isLoading,
        error,
        refreshStockists: fetchStockists,
        addStockist,
        addStockistRequest,
      }}
    >
      {children}
    </StockistContext.Provider>
  );
}

export function useStockists() {
  const context = useContext(StockistContext);
  if (!context) {
    throw new Error("useStockists must be used inside StockistProvider");
  }
  return context;
}
