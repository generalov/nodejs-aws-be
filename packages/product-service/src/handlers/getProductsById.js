import * as db from "../db";

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  };

  if (!event?.pathParameters?.productId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify("Bad Request"),
    };
  }

  try {
    const { productId } = event.pathParameters;
    const product = await db.products.getById(productId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
    };
  } catch (e) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify(e.message),
    };
  }
}
