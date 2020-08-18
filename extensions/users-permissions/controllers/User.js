const _ = require('lodash');
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
    const {
      request: {
        body,
      },
      state: {
        user,
      },
    } = ctx;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    const data = _.omit(body, [
      'blocked',
      'confirmed',
      'email',
      'provider',
      'type',
      'role',
      'resetPasswordToken',
      'verified',
    ]);

    if (body.password) {
      const currentPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
        body.currentPassword,
        user.password,
      );

      if (!currentPassword) {
        throw strapi.errors.badRequest(null, {
          errors: [
            { message: 'Invalid current password' },
          ],
        });
      }

      delete body.currentPassword;
    }

    const updatedData = await strapi.plugins['users-permissions'].services.user.edit(
      { id: user.id },
      data,
    );

    ctx.send(sanitizeUser(updatedData));
  },
};
