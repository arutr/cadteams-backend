module.exports = async (ctx, next) => {
  const { user } = ctx.state;

  if (user && user.type === 'enterprise') {
    return next();
  }

  ctx.unauthorized();
};
