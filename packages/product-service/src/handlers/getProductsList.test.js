jest.mock("../db");
import * as db from "../db";
import { handler } from "./getProductsList";

test("should respond with products list", async () => {
  db.products.findAll.mockResolvedValue([]);
  const event = {}

  const resp = await handler(event);

  expect(resp.statusCode).toBe(200);
  expect(resp.body).toBe("[]");
});
