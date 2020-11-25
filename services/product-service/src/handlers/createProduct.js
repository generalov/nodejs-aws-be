import middy from "@middy/core";
import middyHttpCors from "@middy/http-cors";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import middyErrorHandler from "middy-http-error-handler";
import middyRequestLogger from "middy-request-logger";
import * as db from "../db";

export const handler = middy(createProduct).use([
  middyErrorHandler(),
  middyRequestLogger(),
  middyHttpCors(),
  middyJsonBodyParser(),
]);

export async function createProduct(event) {
  const { body } = event;
  const productId = await db.products.create(body);
  const product = await db.products.getById(productId);
  return {
    statusCode: 200,
    body: JSON.stringify(product),
  };
}
