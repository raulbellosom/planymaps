const processFiles = async (req, res, next) => {
  if (!req.files) {
    return next();
  }
  const basePath = "uploads/inventories/files/";
  const files =
    req.files["files"]?.map((file) => ({
      url: `${basePath}${file.filename}`,
      type: file.mimetype,
      metadata: file,
    })) || [];

  req.files = files;
  next();
};

export { processFiles };
