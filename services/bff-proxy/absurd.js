export function handler(event, ctx, callback) {
  // Serverless supports HTTP_PROXY integration in a somewhat hackish manner.
  // It still requires a handler in lambda function definition,
  // which, however, is not intended to be called by the API Gateway.
  // https://github.com/serverless/serverless/pull/3534
  //
  // There is an open feature proposal to support HTTP Proxy Api Gateway integration
  // https://github.com/serverless/serverless/issues/4539
  callback("Invalid configuration");
}
