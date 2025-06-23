import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  //  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

  // 🔐 Get token from cookies
  const cookieToken = req.cookies?.accessToken;

  // 🔐 Get token from Authorization header
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;

  // ✅ Final token fallback: cookie > header
  const token = cookieToken || bearerToken;

  if (!token) {
    throw new ApiError(401, "Access token missing from request");
  }

  try {
    // 🔎 Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 🧑‍💻 Get user by decoded ID
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User not found for this token");
    }

    // 📨 Attach user to request
    req.user = user;

    // ✅ Proceed to next middleware
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }
});
