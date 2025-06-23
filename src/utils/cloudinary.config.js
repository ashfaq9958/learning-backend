import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Upload Utility
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    // 🧾 Check if file path exists
    if (!localFilePath) return null;

    // 📤 Upload to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("✅ File uploaded successfully:", response.url);

    // 🧹 Delete local file after upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);

    // 🧹 Ensure local file is cleaned up even on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return null;

    // Extract the public ID from the Cloudinary URL
    const publicId = fileUrl.split("/").pop().split(".")[0];

    const result = await cloudinary.uploader.destroy(publicId);
    return result; // usually returns { result: "ok" }
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error.message);
    return null;
  }
};
