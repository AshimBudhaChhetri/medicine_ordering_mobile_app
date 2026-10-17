import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

export type ApprovedStockist = {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
};

export type StockistApprovalRequest = {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;

  submittedDate: string;

  status: "PENDING" | "REJECTED";

  rejectionReason?: string;
};

type NewStockistRequest = {
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
};

type StockistContextType = {
  approvedStockists: ApprovedStockist[];

  approvalRequests: StockistApprovalRequest[];

  addStockistRequest: (
    stockist: NewStockistRequest
  ) => void;
};

const StockistContext =
  createContext<StockistContextType | undefined>(
    undefined
  );

const initialApprovedStockists: ApprovedStockist[] = [
  {
    id: "stockist-1",
    name: "Shree Pharmacy",
    location: "Kathmandu",
    contactPerson: "Ram Sharma",
    phone: "9800000001",
  },

  {
    id: "stockist-2",
    name: "City Medical",
    location: "Lalitpur",
    contactPerson: "Suman Maharjan",
    phone: "9800000002",
  },

  {
    id: "stockist-3",
    name: "ABC Pharmacy",
    location: "Bhaktapur",
    contactPerson: "Bikash Thapa",
    phone: "9800000003",
  },
];

const initialApprovalRequests: StockistApprovalRequest[] = [
  {
    id: "request-1",
    name: "Everest Pharmacy",
    location: "Lalitpur",
    contactPerson: "Hari KC",
    phone: "9800000010",
    address: "Jawalakhel, Lalitpur",

    submittedDate: "30 Sep 2026",

    status: "REJECTED",

    rejectionReason:
      "This stockist is already registered in the system.",
  },
];

export function StockistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    approvalRequests,
    setApprovalRequests,
  ] = useState(initialApprovalRequests);

  const [
    approvedStockists,
  ] = useState(initialApprovedStockists);

  const addStockistRequest = (
    stockist: NewStockistRequest
  ) => {
    const newRequest: StockistApprovalRequest = {
      id: `request-${Date.now()}`,

      ...stockist,

      submittedDate: new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ),

      status: "PENDING",
    };

    setApprovalRequests((current) => [
      newRequest,
      ...current,
    ]);
  };

  return (
    <StockistContext.Provider
      value={{
        approvedStockists,
        approvalRequests,
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
    throw new Error(
      "useStockists must be used inside StockistProvider"
    );
  }

  return context;
}