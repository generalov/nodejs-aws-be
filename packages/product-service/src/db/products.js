import productList from "./productList.json";

export function findAll() {
  return Promise.resolve(productList);
}

export function getById(productId) {
  const product = productList.find((product) => product.id === productId);
  return product
    ? Promise.resolve(product)
    : Promise.reject(new Error("Product not found"));
}
