import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./models/index.js";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import priceEstimateRoutes from "./routes/price_estimates.js";
import reviewRoutes from "./routes/reviews.js";
import amenityRoutes from "./routes/amenities.js";
import userProfileRoutes from "./routes/user_profiles.js";

const app = express();
const PORT = 8090;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


//Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/price_estimates", priceEstimateRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/amenities", amenityRoutes);
app.use("/api/user_profiles", userProfileRoutes);

//Error handling
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.send(500).send("Something broke" + err);
});

db.sequelize
  .sync()
  .then(() => {
    console.log("database conected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB failed:", err);
  });
