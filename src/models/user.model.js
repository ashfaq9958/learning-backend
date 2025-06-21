import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// User schema definition
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, // Cloudinary URL
      default: "",
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "History",
      },
    ],
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to compare passwords
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  const expiry = process.env.ACCESS_TOKEN_EXPIRY || "1d";

  if (!secret) throw new Error("Missing ACCESS_TOKEN_SECRET");

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname,
    },
    secret,
    { expiresIn: expiry }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiry = process.env.REFRESH_TOKEN_EXPIRY || "7d";

  if (!secret) throw new Error("Missing REFRESH_TOKEN_SECRET");

  return jwt.sign({ id: this._id }, secret, { expiresIn: expiry });
};

// Export model
export const User = mongoose.models.User || mongoose.model("User", userSchema);
