import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary";

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "adyapan-resumes",
    allowed_formats: ["pdf", "doc", "docx"],
    resource_type: "raw",        // needed for non-image files
    use_filename: true,
    unique_filename: true,
  } as object,
});

export const upload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
