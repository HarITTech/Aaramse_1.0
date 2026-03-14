import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();


// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImageOnCloudinary = async (filePath) => {
    try {
      // Upload the image
      const uploadResult = await cloudinary.v2.uploader.upload(filePath, {
        public_id: `image_${Date.now()}` // Optionally set a unique public ID
      });
  
      // Return the result
      fs.unlinkSync(filePath); // Delete local file after upload
      return uploadResult;
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error.message);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete local file on failure too
      }
      throw new Error('Cloudinary upload failed: ' + error.message);
    }
};

export const deleteImageFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Image ${publicId} deleted from Cloudinary`);
  } catch (error) {
    console.error(`Failed to delete image from Cloudinary: ${error.message}`);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

