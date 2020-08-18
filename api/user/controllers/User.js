const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

const sanitizeUser = (user) => sanitizeEntity(user, {
  model: strapi.query('user', 'users-permissions').model,
});

const anonymizeUsername = (username) => {
  const lastSpace = username.lastIndexOf(' ') + 1;
  const firstName = username.substr(0, lastSpace);
  const lastName = username.substr(lastSpace, username.length);
  return [firstName, lastName];
};

module.exports = {
  /**
   * Retrieve an individual.
   * @return {Object}
   */
  async findIndividual(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    const { id } = ctx.params;
    let data = await strapi.plugins['users-permissions'].services.user.fetch({ id });

    if (!data) {
      return ctx.notFound(null, [{ messages: [{ id: 'Profile not found' }] }]);
    }

    data = sanitizeUser(data);
    let individual;

    if (user.type === 'individual') {
      individual = _.pick(data, [
        'id',
        'type',
        'profilePicture',
        'username',
        'specialization',
        'sectors',
        'location',
        'country',
        'experience',
        'languages',
        'tools',
        'designs',
        'description',
      ]);
      const [firstName, lastName] = anonymizeUsername(individual.username);
      individual.username = `${firstName}${lastName[0]}.`;
    } else if (user.type === 'enterprise') {
      individual = _.omit(data, ['email', 'updated_by']);
    }

    ctx.send(individual);
  },
  /**
   * Retrieve Individuals
   * @param ctx
   * @returns {Promise<void>}
   */
  async findIndividuals(ctx) {
    const {
      query: {
        sectors,
        specialization,
        ...filters
      },
    } = ctx;
    let users = await strapi.query('user', 'users-permissions').find(
      {
        type: 'individual',
        dailyRate_gt: 0,
        _sort: 'verified:DESC',
        _or: [
          { phone_ne: 0 },
          { contactEmail_gt: 0 },
        ],
        specialization_in: specialization,
        ...filters,
      },
      ['designs', 'profilePicture', 'sectors'],
    );

    if (sectors) {
      users = users.filter((user) => user.sectors.some(({ label }) => sectors.includes(label)));
    }

    const response = users.reduce((acc, individual) => {
      const { username, designs } = individual;
      const preview = designs.find((design) => design.mime.startsWith('image/'));
      const [firstName, lastName] = anonymizeUsername(username);

      if (preview) {
        const data = _.pick(individual, [
          'id',
          'specialization',
          'profilePicture',
          'verified',
          'instantBooking',
          'dailyRate',
        ]);
        return acc.concat({
          username: `${firstName}${lastName[0]}.`,
          preview,
          ...data,
        });
      }

      return acc;
    }, []);
    ctx.send(response);
  },
};
