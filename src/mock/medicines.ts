export type Medicine = {
  id: string;
  name: string;
  company: string;
  packSize: string;
  price: number;
  stock: number;
};

export const medicines: Medicine[] = [
  {
    id: "med-1",
    name: "Paracetamol 500mg",
    company: "ABC Pharma",
    packSize: "10 x 10 Tablets",
    price: 25,
    stock: 250,
  },
  {
    id: "med-2",
    name: "Amoxicillin 500mg",
    company: "XYZ Pharma",
    packSize: "10 Capsules",
    price: 120,
    stock: 120,
  },
  {
    id: "med-3",
    name: "Cetirizine 10mg",
    company: "MediCore",
    packSize: "10 Tablets",
    price: 45,
    stock: 85,
  },
  {
    id: "med-4",
    name: "Cough Syrup 100ml",
    company: "HealthCare",
    packSize: "100ml",
    price: 85,
    stock: 8,
  },
  {
    id: "med-5",
    name: "Vitamin C Tablets",
    company: "NutriLife",
    packSize: "10 Tablets",
    price: 50,
    stock: 0,
  },
  {
    id: "med-6",
    name: "Omeprazole 20mg",
    company: "MediCore",
    packSize: "10 Capsules",
    price: 95,
    stock: 60,
  },
];