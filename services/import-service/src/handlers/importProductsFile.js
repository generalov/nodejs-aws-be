import AWS from "aws-sdk";
import httpError from "http-errors";
import middy from "@middy/core";
import middyHttpCors from "@middy/http-cors";
import middyErrorHandler from "middy-http-error-handler";
import middyRequestLogger from "middy-request-logger";

const {
  IMPORT_S3_BUCKET,
  IMPORT_S3_UPLOAD_PREFIX,
  IMPORT_S3_REGION,
} = process.env;
const ALLOWED_CONTENT_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "text/x-csv",
];

export const handler = middy(importProductsFile).use([
  middyErrorHandler(),
  middyRequestLogger(),
  middyHttpCors(),
]);

export async function importProductsFile(event) {
  const { name: fileName, type: fileType } = event.queryStringParameters;

  if (!fileName) {
    throw new httpError.BadRequest(`'name' should not be empty`);
  }
  if (
    !fileType ||
    !ALLOWED_CONTENT_TYPES.find((allowedType) => fileType.includes(allowedType))
  ) {
    throw new httpError.BadRequest(`Unsupported file type '${fileType}'`);
  }

  const s3 = new AWS.S3({ region: IMPORT_S3_REGION });
  const uploadPath = IMPORT_S3_UPLOAD_PREFIX + fileName;
  const url = await s3.getSignedUrlPromise("putObject", {
    Bucket: IMPORT_S3_BUCKET,
    Key: uploadPath,
    Expires: 60,
    ContentType: fileType,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(url),
  };
}
