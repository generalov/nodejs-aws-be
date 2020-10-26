jest.mock("../db");
import * as db from "../db";
import { handler } from "./getProductsById";

test("should get product by id", async () => {
  const product = { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80a0" };
  const event = {
    pathParameters: { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80a0" },
  };
  db.products.getById.mockResolvedValue(product);

  const resp = await handler(event);

  expect(resp.statusCode).toBe(200);
  expect(resp.headers).toEqual({
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
  });
  expect(resp.body).toBe(JSON.stringify(product));
});

test("should renturn Product not found when the product does not exist", async () => {
  const event = {
    pathParameters: { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80a0" },
  };
  db.products.getById.mockRejectedValue(new Error("Product not found"));

  const resp = await handler(event);

  expect(resp.statusCode).toBe(404);
  expect(resp.headers).toEqual({
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
  });
  expect(resp.body).toBe('"Product not found"');
});

test("should renturn Bad Request when path parameter is empty", async () => {
  const event = {};
  const resp = await handler(event);

  expect(resp.statusCode).toBe(400);
  expect(resp.headers).toEqual({
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
  });
  expect(resp.body).toBe('"Bad Request"');
});
