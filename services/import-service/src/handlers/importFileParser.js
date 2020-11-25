import AWS from "aws-sdk";
import logger from "logger";
import csvParser from "csv-parser";
import { Transform, pipeline as _pipeline } from "stream";
import { promisify } from "util";
import middy from "@middy/core";
import middyRequestLogger from "middy-request-logger";

const pipeline = promisify(_pipeline);

const {
  IMPORT_S3_BUCKET,
  IMPORT_S3_UPLOAD_PREFIX,
  IMPORT_S3_REGION,
  IMPORT_S3_PARSED_PREFIX,
} = process.env;

export const handler = middy(importFileParser).use([middyRequestLogger()]);

export async function importFileParser(event, context, callback) {
  const s3 = new AWS.S3({ region: IMPORT_S3_REGION });
  const sqs = new AWS.SQS();

  const tasks = event.Records.map(async (record) => {
    const srcKey = record.s3.object.key;
    const destKey = srcKey.replace(
      IMPORT_S3_UPLOAD_PREFIX,
      IMPORT_S3_PARSED_PREFIX
    );

    // parse CSV
    const uploadedObject = s3.getObject({
      Bucket: IMPORT_S3_BUCKET,
      Key: srcKey,
    });
    await pipeline(
      uploadedObject.createReadStream(),
      csvParser(),
      streamTap(async ({ data }) => {
        const message = {
          QueueUrl: process.env.CATALOG_ITEMS_QUEUE_SQS_URL,
          MessageBody: JSON.stringify(data),
        };
        try {
          await sqs.sendMessage(message).promise();
          logger.log(`Send message for: ${JSON.stringify(data)}`);
        } catch (err) {
          logger.log(`Fail sending message for: ${JSON.stringify(data)}`);
          logger.log(JSON.stringify(err.message));
        }
      })
    );

    // move
    await s3
      .copyObject({
        Bucket: IMPORT_S3_BUCKET,
        CopySource: IMPORT_S3_BUCKET + "/" + srcKey,
        Key: destKey,
      })
      .promise();
    await s3
      .deleteObject({
        Bucket: IMPORT_S3_BUCKET,
        Key: srcKey,
      })
      .promise();
  });

  const results = await Promise.allSettled(tasks);
  const success = results.filter(({ status }) => status === "fulfilled");
  logger.log(
    `${success.length} of ${results.length} files was copied successfully`
  );
}

export function streamTap(fn) {
  return new Transform({
    objectMode: true,
    transform: async (data, encoding, done) => {
      try {
        await fn({ data, encoding });
      } catch (err) {
        done(err);
        return;
      }
      done(null, data);
    },
  });
}
