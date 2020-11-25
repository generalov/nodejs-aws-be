import logger from "logger";

export default () => {
  return {
    before: (handler, next) => {
      logger.log(JSON.stringify(handler.event));
      return next();
    },
  };
};
