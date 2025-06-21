import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.config.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log("requesttttt:", req);
  const { fullname, email, password, username } = req.body;

  // 🚫 Check if required fields are present
  if (
    [fullname, email, password, username].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(
      400,
      "All required fields (fullname, email, username, password) must be provided."
    );
  }

  // 📧 Basic email format validation
  if (!email.includes("@")) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  // 🔍 Check if user with same email or username already exists
  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "A user with this email or username already exists. Please use a different one."
    );
  }

  // 🖼️ Handle image uploads (avatar is required, coverImage is optional)
  const avatarFilePath = req.files?.avatar?.[0]?.path;
  const coverImageFilePath = req.files?.coverImage?.[0]?.path;

  if (!avatarFilePath) {
    throw new ApiError(400, "User avatar image is required.");
  }

  // ☁️ Upload avatar and cover image to Cloudinary
  const uploadedAvatar = await uploadOnCloudinary(avatarFilePath);
  const uploadedCoverImage = coverImageFilePath
    ? await uploadOnCloudinary(coverImageFilePath)
    : { url: "" };

  if (!uploadedAvatar?.url) {
    throw new ApiError(500, "Failed to upload avatar image. Please try again.");
  }

  // 👤 Create the new user in the database
  const newUser = await User.create({
    fullname: fullname.trim(),
    username: username.toLowerCase().trim(),
    password,
    email: email.toLowerCase().trim(),
    avatar: uploadedAvatar.url,
    coverImage: uploadedCoverImage.url,
  });

  // 🧼 Remove sensitive fields before sending user data in response
  const sanitizedUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!sanitizedUser) {
    throw new ApiError(
      500,
      "An unexpected error occurred while retrieving user data."
    );
  }

  // ✅ Return successful response
  return res
    .status(201)
    .json(new ApiResponse(201, sanitizedUser, "User registered successfully."));
});

export default registerUser;
