import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
  "image/heic",
  "image/heif",
];

const buildUploadMiddleware = (folderName, maxFileSize = 50 * 1024 * 1024) => {
  const uploadDir = path.resolve(__dirname, `../uploads/${folderName}`);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}${path.extname(file.originalname).toLowerCase()}`;
      cb(null, uniqueName);
    },
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file type. Please upload a valid image."));
      }
    },
    limits: {
      fileSize: maxFileSize,
    },
  });
};

const propertyUpload = buildUploadMiddleware("properties");

export const profileUpload = buildUploadMiddleware(
  "profilepictures",
  5 * 1024 * 1024,
);
export default propertyUpload;

