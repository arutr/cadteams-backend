const Mailchimp = require('mailchimp-api-v3');

module.exports = async (ctx, next) => {
  await next();

  if (process.env.NODE_ENV !== 'development' && ctx.status === 200) {
    const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);
    const {
      email, newsletter, username, type,
    } = ctx.request.body;

    try {
      await mailchimp.post(`/lists/${process.env.MAILCHIMP_SIGNUP_LIST_ID}/members`, {
        email_address: email,
        email_type: 'html',
        status: newsletter ? 'subscribed' : 'transactional',
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
            enabled: !!newsletter,
          },
        ],
      });
      strapi.log.info(`${email} added to Mailchimp, newsletter: ${!!newsletter}`);
    } catch (error) {
      strapi.log.error('Newsletter signup failed:');
      strapi.log.error(error);
    }
  }
};
