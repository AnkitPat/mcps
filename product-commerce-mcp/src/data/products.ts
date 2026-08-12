import type { Product } from "../types/product.js";

export const products: Product[] = [
  {
    id: "P1001",
    name: "ThinkBook Pro 14",
    description:
      "14-inch productivity laptop designed for business and everyday computing.",
    brand: "Lenovo",
    category: "laptops",
    price: 69999,
    currency: "INR",
    availability: "in_stock",
    stock: 12,
    rating: 4.5,
    reviewCount: 1240,
    attributes: {
      processor: "Intel Core i5-1340P",
      ram: "16 GB",
      storage: "512 GB SSD",
      display: "14 inch 2.8K",
      operatingSystem: "Windows 11",
      weight: "1.4 kg"
    }
  },

  {
    id: "P1002",
    name: "Inspiron 14 Plus",
    description:
      "Premium 14-inch laptop for productivity, development and multimedia.",
    brand: "Dell",
    category: "laptops",
    price: 74999,
    currency: "INR",
    availability: "in_stock",
    stock: 8,
    rating: 4.4,
    reviewCount: 980,
    attributes: {
      processor: "Intel Core i7-13620H",
      ram: "16 GB",
      storage: "1 TB SSD",
      display: "14 inch QHD+",
      operatingSystem: "Windows 11",
      weight: "1.6 kg"
    }
  },

  {
    id: "P1003",
    name: "MacBook Air M3",
    description:
      "Lightweight laptop powered by Apple's M3 chip.",
    brand: "Apple",
    category: "laptops",
    price: 89999,
    currency: "INR",
    availability: "in_stock",
    stock: 5,
    rating: 4.8,
    reviewCount: 2150,
    attributes: {
      processor: "Apple M3",
      ram: "16 GB",
      storage: "512 GB SSD",
      display: "13.6 inch Retina",
      operatingSystem: "macOS",
      weight: "1.24 kg"
    }
  },

  {
    id: "P2001",
    name: "Pixel Pro",
    description:
      "Premium smartphone with advanced camera and AI features.",
    brand: "Google",
    category: "smartphones",
    price: 79999,
    currency: "INR",
    availability: "in_stock",
    stock: 15,
    rating: 4.6,
    reviewCount: 1650,
    attributes: {
      display: "6.7 inch OLED",
      ram: "12 GB",
      storage: "256 GB",
      camera: "50 MP",
      battery: "5050 mAh"
    }
  }
];