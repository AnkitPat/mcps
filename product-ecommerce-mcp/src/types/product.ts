export interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  availability: "in_stock" | "out_of_stock";
  stock: number;

  attributes: Record<string, string>;

  rating: number;
  reviewCount: number;
}