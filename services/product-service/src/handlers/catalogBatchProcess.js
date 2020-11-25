import middy from "@middy/core";
import AWS from "aws-sdk";
import middyRequestLogger from "middy-request-logger";
import logger from "logger";
import * as db from "../db";

export const handler = middy(catalogBatchProcess).use([middyRequestLogger()]);

export async function catalogBatchProcess(event) {
  let emailMessage;

  try {
    const rows = event.Records.map(({ body }) => JSON.parse(body));
    const documentIdList = await db.products.bulkCreate(rows);
    emailMessage = mapToSuccessMessage({ documentIdList, rows });
  } catch (err) {
    const reason = {
      error: err.message,
      input: event.Records,
    };
    logger.log(`Failed to bulk create products ${JSON.stringify(reason)}`);
    emailMessage = mapToFailMessage(reason);
  }

  try {
    await new AWS.SNS({ region: process.env.AWS_REGION })
      .publish(emailMessage)
      .promise();
  } catch (err) {
    logger.log(`Failed to send an email message: ${err.message}`);
  }
}

const mapToSuccessMessage = (report) => ({
  Subject: "Document import complete",
  Message: JSON.stringify(report, null, 2),
  TopicArn: process.env.SNS_ARN,
  MessageAttributes: {
    status: {
      DataType: "String",
      StringValue: "success",
    },
  },
});

const mapToFailMessage = (reason) => ({
  Subject: "Document import failed",
  Message: JSON.stringify(reason, null, 2),
  TopicArn: process.env.SNS_ARN,
  MessageAttributes: {
    status: {
      DataType: "String",
      StringValue: "fail",
    },
  },
});
