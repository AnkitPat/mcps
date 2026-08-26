import { Router } from "express";
import { listProducts, getProductById, getOrdersByUserId } from "./dal.js";

export const router = Router();

router.get("/products", (req, res) => {
  const products = listProducts({
    query: req.query.query as string,
    category: req.query.category as string,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(products);
});

router.get("/products/:id", (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) {
    return res.status(404).send("Product not found");
  }
  res.json(product);
});

router.get("/orders/:userId", (req, res) => {
  const orders = getOrdersByUserId(req.params.userId);
  res.json(orders);
});
