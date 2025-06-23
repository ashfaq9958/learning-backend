import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.config.js";
import jwt from "jsonwebtoken";

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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Please provide username or email.");
  }

  if (!password || password.trim() === "") {
    throw new ApiError(400, "Password is required.");
  }

  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  });

  if (!user) {
    throw new ApiError(404, "User not found with provided credentials.");
  }

  // 🔐 Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid username/email or password.");
  }

  // 🎟️ Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  try {
    // 🎟️ Store refresh token securely in DB
    user.refreshToken = refreshToken;

    // 💾 Save without triggering all validations again
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    console.error("❌ Error saving refresh token to user document:", error);
    throw new ApiError(500, "Failed to store refresh token");
  }

  // 👤 Remove sensitive info before sending response
  const sanitizedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 🍪 Set refresh token in cookie (secure & HTTP-only)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // 🎉 Send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: sanitizedUser,
          accessToken,
        },
        "User logged in successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // 🔒 Remove refresh token from the database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: "" },
    },
    { new: true }
  );

  // 🍪 Cookie clearing options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // ✅ Clear both access and refresh tokens from cookies and respond
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const renewAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  // 🔒 Check if token is provided
  if (!oldRefreshToken) {
    throw new ApiError(401, "Refresh token is missing or expired.");
  }

  // 🔍 Verify old refresh token
  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(403, "Invalid or expired refresh token.");
  }

  // 👤 Find the user and validate stored token
  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== oldRefreshToken) {
    throw new ApiError(403, "Token mismatch or user not found.");
  }

  // 🧠 Generate new tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // 💾 Save new refresh token and invalidate old one
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  // 🍪 Set both tokens in cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .cookie("accessToken", newAccessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions);

  // ✅ Send response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        "Access token refreshed and refresh token rotated successfully."
      )
    );
});

export { registerUser, loginUser, logoutUser, renewAccessToken };
