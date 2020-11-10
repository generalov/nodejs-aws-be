import * as db from "../db";
import middy from "@middy/core";
import middyHttpCors from "@middy/http-cors";
import middyErrorHandler from "middy-error-handler";
import middyRequestLogger from "middy-request-logger";

export const handler = middy(getProductsList).use([
  middyErrorHandler(),
  middyRequestLogger(),
  middyHttpCors(),
]);

export async function getProductsList() {
  const products = await db.products.findAll();
  return {
    statusCode: 200,
    body: JSON.stringify(products),
  };
}
