import multer, { diskStorage } from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import { v4 } from "uuid";

const BASE_PATH = "src/uploads";

const storage = diskStorage({
  destination: (req, file, cb) => {
    const mapOrPin = req.imageType == "map" ? "map" : "pin";
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
  const file = req.file || null;
  try {
    if (!req.file) {
      return next();
    } else {
      const { mimetype, filename } = file;
      const fileName = path.parse(filename).name;
      const thumbnailDir = path.join(
        BASE_PATH,
        req.imageType == "map" ? "map/thumbnails" : "pin/thumbnails"
      );

      const thumbnailPath = path.join(
        thumbnailDir,
        `${fileName}-thumbnail${path.extname(filename)}`
      );

      // Crear directorios si no existen
      if (!fs.existsSync(thumbnailDir))
        fs.mkdirSync(thumbnailDir, { recursive: true });

      await sharp(file.path).resize(150, 150).toFile(thumbnailPath);

      const urlRelativePath = path.relative(
        "src",
        path.join(
          BASE_PATH,
          req.imageType == "map" ? "map/images" : "pin/files",
          filename
        )
      );

      const thumbnailRelativePath = path.relative("src", thumbnailPath);

      req.processedFiles = {
        url: urlRelativePath,
        type: mimetype,
        metadata: { ...file },
        thumbnail: thumbnailRelativePath,
      };

      next();
    }
  } catch (error) {
    console.error("Error processing images:", error);
    return res.status(500).json({ message: error.message });
  }
};

export { upload, processImages };
