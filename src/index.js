import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import app from "./app.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running at http://localhost:${PORT}`);
    });

    // Handle unexpected server errors
    server.on("error", (err) => {
      console.error("❌ Server error:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start the server:", err);
    process.exit(1);
  }
})();
