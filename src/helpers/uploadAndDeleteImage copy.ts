import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
import GenerateRandomId from "./GenerateRandomId";
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from "../../serviceUrl";
dotenv.config();

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});


export const uploadMedia = async (
  files: Express.Multer.File[]
): Promise<{ imageUrl: string; key: string }[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const randomPrefix = GenerateRandomId();
    const key = `${randomPrefix}-${index}`;

    try {
      // Convert buffer to base64
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        public_id: key,
        resource_type: 'auto' // Automatically detect resource type
      });

      return {
        imageUrl: result.secure_url,
        key: result.public_id
      };
    } catch (err) {
      console.error(err);
      throw new Error(
        `Could not upload file ${file.originalname} to Cloudinary: ${err}`
      );
    }
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (err) {
    console.error("Error uploading files:", err);
    throw new Error("Failed to upload all files.");
  }
};

export const deleteImage = async (keys: string[]): Promise<void> => {
  const deletePromises = keys.map(async (key) => {
    try {
      const result = await cloudinary.uploader.destroy(key);
      if (result.result === 'ok') {
        console.log(`File deleted successfully: ${key}`);
        return true;
      } else {
        throw new Error(`Deletion failed with result: ${result.result}`);
      }
    } catch (error) {
      console.error(`Could not delete file from Cloudinary: ${error}`);
      throw new Error(`Could not delete file from Cloudinary: ${error}`);
    }
  });

  try {
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting files:", error);
    throw new Error("Could not delete one or more files from Cloudinary");
  }
};