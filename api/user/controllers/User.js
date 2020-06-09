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
        'designs',
        'id',
        'profilePicture',
        'specialization',
        'sectors',
        'type',
        'username',
      ]);
    } else if (user.type === 'enterprise') {
      individual = _.omit(data, ['email']);
    }

    ctx.send(individual);
  },
  async findIndividuals(ctx) {
    const users = await strapi.query('user', 'users-permissions').find(
      { type: 'individual' },
      ['sectors', 'designs'],
    );
    const data = users.reduce((acc, individual) => {
      const {
        id, username, sectors, designs,
      } = individual;
      const preview = designs.find((design) => design.mime.startsWith('image/'));
      const [firstName, lastName] = anonymizeUsername(username);

      if (preview) {
        return acc.concat({
          id,
          username: `${firstName} ${lastName[0]}.`,
          sectors,
          preview,
        });
      }

      return acc;
    }, []);
    ctx.send(data);
  },
};
