import { describe, it, expect, vi } from "vitest";
import { router } from "./api.js";
import { listProducts, getProductById, getOrdersByUserId } from "./dal.js";
// Mocking the DAL
vi.mock("./dal.js", () => ({
    listProducts: vi.fn(),
    getProductById: vi.fn(),
    getOrdersByUserId: vi.fn(),
}));
describe("API Router", () => {
    it("should list products", () => {
        listProducts.mockReturnValue([{ id: "1", name: "Product 1" }]);
        const req = { query: {} };
        const res = { json: vi.fn() };
        // Simulate finding the right route
        const route = router.stack.find(s => s.route?.path === "/products");
        route.route.stack[0].handle(req, res);
        expect(res.json).toHaveBeenCalledWith([{ id: "1", name: "Product 1" }]);
    });
    it("should get product by id", () => {
        getProductById.mockReturnValue({ id: "1", name: "Product 1" });
        const req = { params: { id: "1" } };
        const res = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
        const route = router.stack.find(s => s.route?.path === "/products/:id");
        route.route.stack[0].handle(req, res);
        expect(res.json).toHaveBeenCalledWith({ id: "1", name: "Product 1" });
    });
    it("should return 404 if product not found", () => {
        getProductById.mockReturnValue(undefined);
        const req = { params: { id: "999" } };
        const res = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
        const route = router.stack.find(s => s.route?.path === "/products/:id");
        route.route.stack[0].handle(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it("should get orders by user id", () => {
        getOrdersByUserId.mockReturnValue([{ id: "o1", userId: "u1" }]);
        const req = { params: { userId: "u1" } };
        const res = { json: vi.fn() };
        const route = router.stack.find(s => s.route?.path === "/orders/:userId");
        route.route.stack[0].handle(req, res);
        expect(res.json).toHaveBeenCalledWith([{ id: "o1", userId: "u1" }]);
    });
});
