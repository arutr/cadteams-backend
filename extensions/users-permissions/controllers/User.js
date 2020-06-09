// users/me with media and relational fields
const { sanitizeEntity } = require('strapi-utils');

const sanitizeUser = (user) => sanitizeEntity(user, {
  model: strapi.query('user', 'users-permissions').model,
});

module.exports = {
  async me(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    const userQuery = await strapi.query('user', 'users-permissions');
    const userWithMedia = await userQuery.findOne({ id: user.id });

    const data = sanitizeUser(userWithMedia);
    ctx.send(data);
  },
  /**
   * Update the logged in user information.
   * @return {Object}
   */
  async updateMe(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    const updatedData = await strapi.plugins['users-permissions'].services.user.edit(
      { id: user.id },
      { ...ctx.request.body },
    );

    const data = sanitizeUser(updatedData);
    ctx.send(data);
  },
};
