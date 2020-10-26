jest.mock("../db");
import * as db from "../db";
import { handler } from "./getProductsList";

test("should respond with products list", async () => {
  db.products.findAll.mockResolvedValue([]);

  const resp = await handler();

  expect(resp.statusCode).toBe(200);
  expect(resp.headers).toEqual({
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
  });
  expect(resp.body).toBe("[]");
});
