/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    const { user } = ctx.state;

    if (!user) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'No authorization header was found' },
        ],
      });
    }

    const { acquaintance: id } = ctx.request.body;
    const acquaintance = await strapi.query('user', 'users-permissions').findOne({
      id,
    });

    if (!acquaintance || acquaintance.type !== 'individual') {
      throw strapi.errors.notFound(null, {
        errors: [
          { message: 'User not found' },
        ],
      });
    }

    const connection = await strapi.query('connection').count({
      user: user.id,
      acquaintance: acquaintance.id,
    });

    if (connection) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'Connection with this user already exists' },
        ],
      });
    }

    try {
      const data = await strapi.query('connection').create(ctx.request.body);
      await strapi.services.connection.sendInviteNotification(data);
    } catch (error) {
      throw strapi.errors.badImplementation(null, {
        errors: [
          { message: 'Failed to create connection request' },
        ],
      });
    }

    ctx.send(200);
  },
  /**
   * Count records.
   *
   * @return {Number}
   */

  count(ctx) {
    const {
      query: {
        status,
      },
      state: {
        user,
      },
    } = ctx;

    if (!user || !user.type) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'No authorization header was found' },
        ],
      });
    }

    if (user.type === 'individual') {
      return strapi.services.connection.count({
        acquaintance: user.id,
        status,
      });
    }

    if (user.type === 'enterprise') {
      return strapi.services.connection.count({
        user: user.id,
        status,
      });
    }

    throw strapi.errors.notFound(null, {
      errors: [
        { message: 'Unknown user' },
      ],
    });
  },
  /**
   * Check if a user is connected with another one
   * @param ctx
   * @returns {Promise<void>}
   */

  async exists(ctx) {
    const {
      params: {
        id,
      },
      state: {
        user,
      },
    } = ctx;

    if (!user) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'No authorization header was found' },
        ],
      });
    }

    if (!id) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'Missing connection identifier' },
        ],
      });
    }

    let data;

    if (user.type === 'individual') {
      data = await strapi.query('connection').findOne({ user: id, acquaintance: user.id });
    } else if (user.type === 'enterprise') {
      data = await strapi.query('connection').findOne({ user: user.id, acquaintance: id });
    } else {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'Unknown user type' },
        ],
      });
    }

    if (!data) {
      return ctx.notFound(null);
    }

    ctx.send({ status: data.status });
  },
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    const { user } = ctx.state;

    if (!user) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'No authorization header was found' },
        ],
      });
    }

    if (user.type === 'individual') {
      await strapi.services.connection.findEnterprises(ctx);
    } else if (user.type === 'enterprise') {
      await strapi.services.connection.findIndividuals(ctx);
    } else {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'Unknown user type' },
        ],
      });
    }
  },
  /**
   * Update a record.
   *
   * @return {Object}
   */

  async update(ctx) {
    const {
      params: {
        id,
      },
      request: {
        body: {
          status,
        },
      },
      state: {
        user,
      },
    } = ctx;

    if (!user || !user.type) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'No authorization header was found' },
        ],
      });
    }

    if (!id) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'Missing connection identifier' },
        ],
      });
    }

    if (user.type === 'individual') {
      const connection = await strapi.query('connection').findOne({ id, acquaintance: user.id });

      if (!connection) {
        throw strapi.errors.notFound(null, {
          errors: [
            { message: 'Connection not found' },
          ],
        });
      }

      if (connection.status === 'pending' && status === 'connected') {
        const data = await strapi.query('connection').update({ id }, { status });
        await strapi.services.connection.sendAcceptNotification(data);
      }
    }

    ctx.send(200);
  },
  /**
   * Delete a record.
   *
   * @return {Object}
   */

  async delete(ctx) {
    const {
      params: {
        id,
      },
      state: {
        user,
      },
    } = ctx;

    if (!user || !user.type) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'No authorization header was found' },
        ],
      });
    }

    if (!id) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { message: 'Missing connection identifier' },
        ],
      });
    }

    const connection = await strapi.query('connection').delete({
      id,
      _or: [
        { user: user.id },
        { acquaintance: user.id },
      ],
    });

    if (!connection) {
      throw strapi.errors.notFound(null, {
        errors: [
          { message: 'Connection not found' },
        ],
      });
    }

    ctx.send(200);
  },
};
