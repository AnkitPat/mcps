import { describe, it, expect, vi } from "vitest";
import { router } from "./api.js";
import { listProducts, getProductById, getOrdersByUserId } from "./dal.js";
import express from "express";

// Mocking the DAL
vi.mock("./dal.js", () => ({
  listProducts: vi.fn(),
  getProductById: vi.fn(),
  getOrdersByUserId: vi.fn(),
}));

describe("API Router", () => {
  it("should list products", () => {
    (listProducts as any).mockReturnValue([{ id: "1", name: "Product 1" }]);
    
    const req = { query: {} } as any;
    const res = { json: vi.fn() } as any;
    
    // Simulate finding the right route
    const route = router.stack.find(s => s.route?.path === "/products");
    route.route.stack[0].handle(req, res);
    
    expect(res.json).toHaveBeenCalledWith([{ id: "1", name: "Product 1" }]);
  });

  it("should get product by id", () => {
    (getProductById as any).mockReturnValue({ id: "1", name: "Product 1" });
    
    const req = { params: { id: "1" } } as any;
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
    
    const route = router.stack.find(s => s.route?.path === "/products/:id");
    route.route.stack[0].handle(req, res);
    
    expect(res.json).toHaveBeenCalledWith({ id: "1", name: "Product 1" });
  });

  it("should return 404 if product not found", () => {
    (getProductById as any).mockReturnValue(undefined);
    
    const req = { params: { id: "999" } } as any;
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
    
    const route = router.stack.find(s => s.route?.path === "/products/:id");
    route.route.stack[0].handle(req, res);
    
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should get orders by user id", () => {
    (getOrdersByUserId as any).mockReturnValue([{ id: "o1", userId: "u1" }]);
    
    const req = { params: { userId: "u1" } } as any;
    const res = { json: vi.fn() } as any;
    
    const route = router.stack.find(s => s.route?.path === "/orders/:userId");
    route.route.stack[0].handle(req, res);
    
    expect(res.json).toHaveBeenCalledWith([{ id: "o1", userId: "u1" }]);
  });
});
