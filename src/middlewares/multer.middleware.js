import multer from "multer";

// Configure disk storage for multer
const storage = multer.diskStorage({
  // Set the destination folder where files will be temporarily stored
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Make sure this path exists
  },

  // Generate a unique filename using the field name and a timestamp
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

// Create a multer instance using the defined storage engine
export const upload = multer({ storage });
