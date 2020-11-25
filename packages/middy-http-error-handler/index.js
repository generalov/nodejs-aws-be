// https://github.com/middyjs/middy/blob/master/packages/http-error-handler/index.js

module.exports = () => {
  return {
    onError: (handler, next) => {
      // https://www.postgresql.org/docs/9.6/errcodes-appendix.html
      if (handler.error.detail && handler.error.code) {
        handler.response = {
          statusCode: handler.error.code.match(/^2[23]/) ? 400 : 500,
          body: JSON.stringify({
            data: handler.error.detail,
          }),
        };
      } else if (handler.error.statusCode && handler.error.message) {
        // handle https://www.npmjs.com/package/http-errors
        handler.response = {
          statusCode: handler.error.statusCode,
          body: JSON.stringify({
            data: handler.error.message,
          }),
        };
      } else {
        handler.response = {
          statusCode: 500,
          body: JSON.stringify({
            data: handler.error.message || "Internal Server Error",
          }),
        };
      }
      return next();
    },
  };
};
