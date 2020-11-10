module.exports = () => {
  return {
    before: (handler, next) => {
      console.log(JSON.stringify(handler.event));
      return next();
    },
  };
};
