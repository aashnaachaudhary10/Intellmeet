import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

// Fallback to parsing CLOUDINARY_URL if the 3 individual keys aren't set
if (process.env.CLOUDINARY_URL && !cloudName) {
  const parts = process.env.CLOUDINARY_URL.replace('cloudinary://', '').split('@');
  if (parts.length === 2) {
    cloudName = parts[1];
    const credentials = parts[0].split(':');
    apiKey = credentials[0];
    apiSecret = credentials[1];
  }
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'intellmeet_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

export default upload;
