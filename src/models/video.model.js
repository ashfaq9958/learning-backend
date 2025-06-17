import { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const videoSchema = new Schema(
//   {
//     videoFile: {
//       type: String, //Cloudinary Url
//       required: true,
//     },
//     thumbnail: {
//       type: String, //Cloudinary Url
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     duration: {
//       type: Number,
//       required: true,
//     },
//     views: {
//       type: Number,
//       required: 0,
//     },
//     isPublished: {
//       type: Boolean,
//       default: true,
//     },
//     owner: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },

//   { timestamps: true }
// );

// videoSchema.plugin(mongooseAggregatePaginate);

// export const Video = model("Video", videoSchema);


const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // Cloudinary URL
      required: [true, "Video file is required"],
      trim: true,
    },
    thumbnail: {
      type: String, // Cloudinary URL
      required: [true, "Thumbnail is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title must be under 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 second"],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Video owner is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add pagination plugin
videoSchema.plugin(mongooseAggregatePaginate);

// Export model
export const Video = model("Video", videoSchema);

