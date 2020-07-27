const _ = require('lodash');
const { yup, formatYupErrors } = require('strapi-utils');

const fileInfoSchema = yup.object({
  name: yup.string().nullable(),
  alternativeText: yup.string().nullable(),
  caption: yup.string().nullable(),
});
const uploadSchema = yup.object({
  fileInfo: fileInfoSchema,
  field: yup.string(),
});

const validateUploadBody = (schema, data = {}) => {
  return schema.validate(data, { abortEarly: false }).catch((err) => {
    throw strapi.errors.badRequest('ValidationError', { errors: formatYupErrors(err) });
  });
};

const isUploadDisabled = () => (
  _.get(strapi.plugins, 'upload.config.enabled', true) === false
);

const disabledPluginError = () => strapi.errors.badRequest(null, {
  errors: [{ id: 'Upload.status.disabled', message: 'File upload is disabled' }],
});

const emptyFileError = () => strapi.errors.badRequest(null, {
  errors: [{ id: 'Upload.status.empty', message: 'Files are empty' }],
});

module.exports = {
  async uploadMe(ctx) {
    const { user } = ctx.state;

    if (!user) {
      throw strapi.errors.badRequest(null, {
        errors: [{ message: 'No authorization header was found' }],
      });
    }

    if (isUploadDisabled()) {
      throw disabledPluginError();
    }

    const files = _.get(ctx.request.files, 'files');

    if (_.isEmpty(files) || files.size === 0) {
      throw emptyFileError();
    }

    const uploadService = strapi.plugins.upload.services.upload;
    const data = await validateUploadBody(uploadSchema, ctx.request.body);

    await uploadService.uploadToEntity({
      id: user.id,
      model: 'user',
      field: data.field,
      fileInfo: data.fileInfo,
    }, files, 'users-permissions');

    await strapi.plugins['users-permissions'].controllers.user.me(ctx);
  },
  async destroyMe(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return strapi.errors.badRequest(null, {
        errors: [{ message: 'No authorization header was found' }],
      });
    }

    const { id } = ctx.params;
    const file = await strapi.plugins.upload.services.upload.fetch({ id });

    if (!file) {
      throw strapi.errors.notFound(null, {
        errors: [{ message: 'File not found' }],
      });
    }

    if (!file.related.some((entity) => entity.id === user.id)) {
      throw strapi.errors.badRequest(null, {
        errors: [{ message: 'Invalid file identifier' }],
      });
    }

    await strapi.plugins.upload.services.upload.remove(file);
    await strapi.plugins['users-permissions'].controllers.user.me(ctx);
  },
};
