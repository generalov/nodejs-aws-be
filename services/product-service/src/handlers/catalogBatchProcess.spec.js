import AWS from "aws-sdk";
import * as db from "../db";
import { handler } from "./catalogBatchProcess";

jest.mock("aws-sdk", () => ({
  SNS: mockClass({
    publish: jest.fn(),
  }),
}));
jest.mock("../db");

const product = {
  title: "title",
  description: "description",
  price: 0.42,
  count: 1,
};

test("catalogBatchProcess should be a function", () => {
  expect(typeof handler).toBe("function");
});

test("catalogBatchProcess should process valid product", async () => {
  db.products.bulkCreate.mockResolvedValue(["1"]);
  AWS.SNS.prototype.publish.mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue(undefined),
  }));

  await handler({
    Records: [{ body: JSON.stringify(product) }],
  });

  expect(AWS.SNS.prototype.publish).toBeCalledWith(
    expect.objectContaining({
      MessageAttributes: {
        status: {
          DataType: "String",
          StringValue: "success",
        },
      },
    })
  );
});

test("catalogBatchProcess should catch product creation failure", async () => {
  db.products.bulkCreate.mockRejectedValue(new Error("fail"));
  AWS.SNS.prototype.publish.mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue(undefined),
  }));

  await handler({
    Records: [{ body: JSON.stringify(product) }],
  });

  expect(AWS.SNS.prototype.publish).toBeCalledWith(
    expect.objectContaining({
      MessageAttributes: {
        status: {
          DataType: "String",
          StringValue: "fail",
        },
      },
    })
  );
});

function mockClass(spec) {
  const proto = jest.fn(() => spec);
  proto.prototype = spec;
  return proto;
}
