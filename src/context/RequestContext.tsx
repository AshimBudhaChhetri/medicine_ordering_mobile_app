import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

export type RequestStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type MedicineRequestItem = {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type MedicineRequest = {
  id: string;
  requestNumber: string;

  stockistId: string;
  stockistName: string;

  items: MedicineRequestItem[];

  totalItems: number;
  totalAmount: number;

  note?: string;

  status: RequestStatus;

  createdAt: string;
};

type CreateMedicineRequestInput = {
  stockistId: string;
  stockistName: string;

  items: MedicineRequestItem[];

  totalItems: number;
  totalAmount: number;

  note?: string;
};

type RequestContextType = {
  requests: MedicineRequest[];

  createRequest: (
    input: CreateMedicineRequestInput
  ) => MedicineRequest;
};

const RequestContext =
  createContext<RequestContextType | undefined>(
    undefined
  );

const initialRequests: MedicineRequest[] = [
  {
    id: "request-1024",
    requestNumber: "REQ-1024",

    stockistId: "stockist-1",
    stockistName: "Shree Pharmacy",

    items: [
      {
        medicineId: "med-1",
        medicineName: "Paracetamol 500mg",
        quantity: 4,
        unitPrice: 25,
        subtotal: 100,
      },
      {
        medicineId: "med-2",
        medicineName: "Amoxicillin 500mg",
        quantity: 2,
        unitPrice: 120,
        subtotal: 240,
      },
    ],

    totalItems: 6,
    totalAmount: 340,

    status: "PENDING",

    createdAt: "03 Oct 2026",
  },

  {
    id: "request-1023",
    requestNumber: "REQ-1023",

    stockistId: "stockist-2",
    stockistName: "City Medical",

    items: [
      {
        medicineId: "med-3",
        medicineName: "Cetirizine 10mg",
        quantity: 5,
        unitPrice: 45,
        subtotal: 225,
      },
    ],

    totalItems: 5,
    totalAmount: 225,

    status: "PROCESSING",

    createdAt: "02 Oct 2026",
  },

  {
    id: "request-1022",
    requestNumber: "REQ-1022",

    stockistId: "stockist-3",
    stockistName: "ABC Pharmacy",

    items: [
      {
        medicineId: "med-6",
        medicineName: "Omeprazole 20mg",
        quantity: 3,
        unitPrice: 95,
        subtotal: 285,
      },
    ],

    totalItems: 3,
    totalAmount: 285,

    status: "COMPLETED",

    createdAt: "01 Oct 2026",
  },
];

export function RequestProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [requests, setRequests] =
    useState<MedicineRequest[]>(
      initialRequests
    );

  const createRequest = (
    input: CreateMedicineRequestInput
  ) => {
    const nextNumber =
      1025 + requests.length;

    const newRequest: MedicineRequest = {
      id: `request-${Date.now()}`,

      requestNumber: `REQ-${nextNumber}`,

      stockistId: input.stockistId,
      stockistName: input.stockistName,

      items: input.items,

      totalItems: input.totalItems,
      totalAmount: input.totalAmount,

      note: input.note,

      status: "PENDING",

      createdAt: new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ),
    };

    setRequests((current) => [
      newRequest,
      ...current,
    ]);

    return newRequest;
  };

  return (
    <RequestContext.Provider
      value={{
        requests,
        createRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestContext);

  if (!context) {
    throw new Error(
      "useRequests must be used inside RequestProvider"
    );
  }

  return context;
}