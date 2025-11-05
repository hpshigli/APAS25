// backend/server.js
import "dotenv/config";
import app from "./app.js";
import { connectDB, sequelize } from "./config/db.js";

const port = process.env.PORT || 4000;

// 🧩 Start function
const start = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: false });

    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// 🧪 Prevent the server from starting in test mode
if (process.env.NODE_ENV !== "test") {
  start();
}

export default app;
