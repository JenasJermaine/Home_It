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
import panoramicTourRoutes from "./routes/panoramic_tours.js";

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
app.use("/api/panoramic_tours", panoramicTourRoutes);

const AMENITY_SEED_VERSION = "amenities-v1";
const MODEL_AMENITIES = [
  "Parking Lot",
  "Designated Servant Quarter",
  "CCTV",
  "Elevator",
  "Garden / Backyard / Play Area",
  "Swimming Pool",
  "Backup Generator",
  "Fixed Internet Infrastructure",
  "Solar Water Heating System",
  "Solar Lighting System",
  "Gym",
  "Fire Safety Precautions",
  "Solar Security Lighting",
  "Access Ramp",
];

const ensureAmenitiesSeed = async () => {
  await db.sequelize.query(`
    CREATE TABLE IF NOT EXISTS AppMeta (
      meta_key VARCHAR(191) NOT NULL PRIMARY KEY,
      meta_value VARCHAR(191) NOT NULL
    )
  `);

  const [rows] = await db.sequelize.query(
    "SELECT meta_value FROM AppMeta WHERE meta_key = 'amenities_seed_version' LIMIT 1",
  );

  if (rows.length > 0 && rows[0].meta_value === AMENITY_SEED_VERSION) {
    return;
  }

  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    await db.sequelize.query("TRUNCATE TABLE PropertyAmenities");
    await db.sequelize.query("TRUNCATE TABLE Amenities");
  } finally {
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  await db.Amenity.bulkCreate(MODEL_AMENITIES.map((name) => ({ name })));
  await db.sequelize.query(
    "INSERT INTO AppMeta (meta_key, meta_value) VALUES ('amenities_seed_version', ?) ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)",
    { replacements: [AMENITY_SEED_VERSION] },
  );
};

//Error handling
app.use((err, req, res, next) => {
  console.log(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: err.message || "Something broke" });
});

db.sequelize
  .sync()
  .then(() => {
    return ensureAmenitiesSeed();
  })
  .then(() => {
    console.log("database conected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB failed:", err);
  });
