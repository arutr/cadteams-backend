/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

const _ = require('lodash');

const hasPermission = (user, permissionType) => {
  const permission = user.notifications.find(({ type }) => type === permissionType);

  return !(permission && permission.email === false);
};

module.exports = {
  /**
   * Find Individuals connected with an Enterprise
   * @param ctx
   * @returns {Promise<void>}
   */
  async findIndividuals(ctx) {
    const {
      query: {
        sectors,
        specialization,
        status,
      },
      state: {
        user,
      },
    } = ctx;

    let connections = await strapi.query('connection').find({
      user: user.id,
      status,
    }, ['acquaintance', 'acquaintance.sectors', 'acquaintance.profilePicture']);
    // eslint-disable-next-line no-shadow
    connections = connections.reduce((acc, { user, acquaintance, ...entry }) => {
      if (specialization && !specialization.includes(acquaintance.specialization)) {
        return acc;
      }

      if (sectors && !acquaintance.sectors.some(({ label }) => sectors.includes(label))) {
        return acc;
      }

      return [...acc, {
        ...entry,
        acquaintance: _.pick(
          acquaintance,
          [
            'id',
            'type',
            'profilePicture',
            'username',
            'specialization',
            'dailyRate',
            'verified',
            'instantBooking',
          ],
          status === 'connected' && ['contactEmail', 'phone'],
        ),
      }];
    }, []);
    ctx.send(connections);
  },
  /**
   * Find Enterprises connected with an Individual
   * @param ctx
   * @returns {Promise<void>}
   */
  async findEnterprises(ctx) {
    const {
      query: {
        status,
      },
      state: {
        user,
      },
    } = ctx;

    let connections = await strapi.query('connection').find({
      acquaintance: user.id,
      status,
    }, ['user', 'user.profilePicture']);
    // eslint-disable-next-line no-shadow
    connections = connections.reduce((acc, { acquaintance, user, ...entry }) => ([...acc, {
      ...entry,
      user: _.pick(
        user,
        [
          'id',
          'type',
          'profilePicture',
          'username',
          'company',
        ],
        status === 'connected' && ['contactEmail', 'phone'],
      ),
    }]), []);
    ctx.send(connections);
  },
  async sendInviteNotification(connection) {
    const {
      user: sender,
      acquaintance: recipient,
      message,
    } = connection;

    if (!hasPermission(recipient, 'connection')) {
      return;
    }

    const template = {
      subject: `CADteams Invitation from ${sender.username}`,
      html: `
        <h2><%= sender.username %> wants to connect on <b>CAD</b>teams!</h2>
        <p>Hi <%= recipient.username %>,</p>
        <p><%= sender.username %> has sent you an invitation to connect on <b>CAD</b>teams.</p>
        <p>Here's why <%=sender.username %> wishes to get in touch with you:</p>
        <hr />
        <p>
          <i style="white-space: pre-wrap"><%= message %></i>
        </p>
        <hr />
        <p>
          <a href="https://cadteams.com/app/contacts">Log onto <b>CAD</b>teams</a> and respond to
          the invitation on Contacts page.
        </p>
        <p>- <b>CAD</b>teams Support</p>
      `,
      text: `
        <%= sender.username %> Wants to Connect on CADteams!
        Hi <%= recipient.username %>,
        <%= sender.username %> has sent you an invitation to connect on CADteams.
        Here's why <%=sender.username %> wishes to get in touch with you:

        <%= message %>

        Log onto CADteams and respond to the invitation on Contacts page.
        - CADteams Support
      `,
    };

    try {
      await strapi.plugins.email.services.email.sendTemplatedEmail(
        {
          to: recipient.email,
          from: `${sender.username} on CADteams <hello@cadteams.com>`,
        },
        template,
        { sender, recipient, message },
      );
      strapi.log.info(`Connect invitation e-mail notification sent to ${recipient.email}`);
    } catch (error) {
      strapi.log.error('Failed to send e-mail notification:');
      strapi.log.error(error);
    }
  },
  async sendAcceptNotification(connection) {
    const {
      user: recipient,
      acquaintance: sender,
    } = connection;

    if (!hasPermission(recipient, 'connection')) {
      return;
    }

    const template = {
      subject: `CADteams Invitation Accepted by ${sender.username}`,
      html: `
        <h2>You're connected with <%= sender.username %> on <b>CAD</b>teams!</h2>
        <p>Hi <%= recipient.username %>,</p>
        <p>
          <%= sender.username %> has <b>accepted</b> your invitation to connect on <b>CAD</b>teams.
        </p>
        <p>
          <a href="https://cadteams.com/app/contacts">Log onto <b>CAD</b>teams</a> and head to
          Contacts page to view the contact details of <%= sender.username %>.
        </p>
        <p>We wish you good luck in future cooperation with <%= sender.username %>!</p>
        <p>- <b>CAD</b>teams Support</p>
      `,
      text: `
        You're connected with <%= sender.username %> on CADteams!
        Hi <%= recipient.username %>,
        <%= sender.username %> has accepted your invitation to connect on CADteams.
        Log onto CADteams and head to Contacts page to view the contact details
        of <%= sender.username %>.
        We wish you good luck in future endeavours with <%= sender.username %>!
        - <b>CAD</b>teams Support
      `,
    };

    try {
      await strapi.plugins.email.services.email.sendTemplatedEmail(
        {
          to: recipient.email,
        },
        template,
        { sender, recipient },
      );
      strapi.log.info(`E-mail notification regarding invitation acceptation sent to ${recipient.email}`);
    } catch (error) {
      strapi.log.error('Failed to send e-mail notification:');
      strapi.log.error(error);
    }
  },
};
