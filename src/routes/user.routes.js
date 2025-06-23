import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  renewAccessToken,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
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

router.patch("/change-password", verifyJWT, changeCurrentPassword);

router.get("/me", verifyJWT, getCurrentUser);

router.put("/update-account", verifyJWT, updateAccountDetails);

router.put(
  "/update-avatar",
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);

router.put(
  "/update-coverimage",
  verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage
);

export default router;
