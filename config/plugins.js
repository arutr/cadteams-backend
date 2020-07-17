module.exports = ({ env }) => ({
  email: {
    provider: 'amazon-ses',
    providerOptions: {
      key: env('AWS_ACCESS_KEY_ID'),
      secret: env('AWS_SECRET_ACCESS_KEY'),
      amazon: 'https://email.eu-west-2.amazonaws.com',
    },
    settings: {
      defaultFrom: 'hello@cadteams.com',
      defaultReplyTo: 'hello@cadteams.com',
    },
  },
});
