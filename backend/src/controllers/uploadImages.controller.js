import multer, { diskStorage } from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import { v4 } from "uuid";

const BASE_PATH = "src/uploads";

const storage = diskStorage({
  destination: (req, file, cb) => {
    const mapOrPin = req.body.type === "map" || req.body.type === "pin";
    const dir = file.mimetype.includes("image")
      ? `${BASE_PATH}/${mapOrPin}/images/`
      : `${BASE_PATH}/${mapOrPin}/files/`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const name = v4();
    cb(null, name + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const processImages = async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  const imageFiles = req.files["images"] || [];
  const imageDestination =
    req.body.type === "map"
      ? `${BASE_PATH}/map/images/`
      : `${BASE_PATH}/pin/images/`;

  const processedFiles = await Promise.all(
    imageFiles.map(async (file) => {
      const fileName = path.parse(file.filename).name;

      const thumbnailDir = `${imageDestination}thumbnails/`;

      const thumbnailPath = `${thumbnailDir}${fileName}-thumbnail.jpg`;

      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      await sharp(file.path).resize(150, 150).toFile(thumbnailPath);

      let urlRelativePath = imageDestination.replace("src/", "");
      let thumbnailRelativePath = thumbnailPath.split("src/")[1];
      return {
        url: `${urlRelativePath}images/${file.filename}`,
        type: file.mimetype,
        metadata: { ...file },
        thumbnail: thumbnailRelativePath,
      };
    })
  );

  req.processedFiles = processedFiles;
  next();
};

export { upload, processImages };
