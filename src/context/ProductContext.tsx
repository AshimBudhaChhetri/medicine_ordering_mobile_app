import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { productService } from "../services/productService";
import {
  CatalogOptions,
  CreateProductInput,
  Product,
  ProductQueryParams,
} from "../types/product";
import { useAuth } from "./AuthContext";

export type ProductContextType = {
  products: Product[];
  catalogOptions: CatalogOptions | null;
  isLoading: boolean;
  error: string | null;
  refreshProducts: (params?: ProductQueryParams) => Promise<void>;
  addProduct: (input: CreateProductInput) => Promise<Product>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(
    async (params?: ProductQueryParams) => {
      if (!isAuthenticated) {
        setProducts([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const [items, options] = await Promise.all([
          productService.getProducts(params),
          productService.getCatalogOptions().catch(() => ({ units: [], types: [] })),
        ]);
        setProducts(items || []);
        setCatalogOptions(options);
      } catch (err: any) {
        console.warn("Failed to load products:", err);
        setError(err?.message || "Failed to load catalogue");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshProducts();
    } else {
      setProducts([]);
    }
  }, [isAuthenticated, refreshProducts]);

  const addProduct = async (input: CreateProductInput): Promise<Product> => {
    const created = await productService.createProduct(input);
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        catalogOptions,
        isLoading,
        error,
        refreshProducts,
        addProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used inside ProductProvider");
  }
  return context;
}
