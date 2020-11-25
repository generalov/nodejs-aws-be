import * as db from "../db";
import httpError from "http-errors";
import middy from "@middy/core";
import middyHttpCors from "@middy/http-cors";
import middyErrorHandler from "middy-http-error-handler";
import middyRequestLogger from "middy-request-logger";

export const handler = middy(getProductById).use([
  middyErrorHandler(),
  middyRequestLogger(),
  middyHttpCors(),
]);

export async function getProductById(event) {
  if (!event.pathParameters?.productId) {
    throw new httpError.BadRequest("Bad Request");
  }

  const { productId } = event.pathParameters;
  const product = await db.products.getById(productId);
  if (!product) {
    throw new httpError.BadRequest("Product not found");
  }
  return {
    statusCode: 200,
    body: JSON.stringify(product),
  };
}
