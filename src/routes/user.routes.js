import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  renewAccessToken,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// 👤 User Registration (with file uploads)
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// 🔐 Login User
router.post("/login", loginUser);

// 🚪 Logout User (requires auth)
router.post("/logout", verifyJWT, logoutUser);

// Refresh Token
router.post("/refresh-token", renewAccessToken);

export default router;
