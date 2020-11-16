import { handler } from "./importProductsFile";
import AWS from "aws-sdk";

// aws-sdk-mock package does not support getSignedUrlPromise,
// so let's use jest
jest.mock("aws-sdk");
jest.mock("middy-request-logger", () => () => ({
  before: (handler, next) => next(),
}));

beforeEach(() => {
  jest
    .spyOn(AWS.S3.prototype, "getSignedUrlPromise")
    .mockResolvedValue("http://aws");
});

test("importProductsFile ", async () => {
  const event = {
    queryStringParameters: { name: "products.csv", type: "text/csv" },
  };

  const resp = await handler(event);

  expect(resp.statusCode).toBe(200);
  expect(resp.body).toBe(JSON.stringify("http://aws"));
});
