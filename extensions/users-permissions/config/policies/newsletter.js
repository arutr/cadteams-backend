const Mailchimp = require('mailchimp-api-v3');

module.exports = async (ctx, next) => {
  await next();

  if (process.env.NODE_ENV !== 'development' && ctx.status === 200 && ctx.request.body.newsletter) {
    const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);
    const { email, username, type } = ctx.request.body;

    try {
      await mailchimp.post(`/lists/${process.env.MAILCHIMP_SIGNUP_LIST_ID}/members`, {
        email_address: email,
        email_type: 'html',
        status: 'subscribed',
        language: 'en',
        merge_fields: {
          FNAME: username.split(' ')[0],
        },
        interests: {
          '63f0589b6e': type === 'individual', // Showcase my portfolio
          '4c5319784d': type === 'enterprise', // Find specialists
        },
        marketing_permissions: [
          {
            marketing_permission_id: '3c570a8376',
            text: `I would like to receive occasional newsletters and important updates from
            CADteams via email`,
            enabled: true,
          },
        ],
      });
      strapi.log.info(`${email} signed up to the newsletter.`);
    } catch (error) {
      strapi.log.error('Newsletter signup failed:');
      strapi.log.error(error);
    }
  }
};
