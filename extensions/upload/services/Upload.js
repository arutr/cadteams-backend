module.exports = {
  async uploadToEntity(params, files, source) {
    const {
      id, model, field, fileInfo,
    } = params;

    const arr = Array.isArray(files) ? files : [files];
    const enhancedFiles = await Promise.all(
      arr.map((file) => this.enhanceFile(
        file,
        fileInfo,
        {
          refId: id,
          ref: model,
          source,
          field,
        },
      )),
    );

    await Promise.all(enhancedFiles.map((file) => this.uploadFileAndPersist(file)));
  },
};
