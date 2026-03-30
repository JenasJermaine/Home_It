import { Sequelize } from "sequelize";
import config from "../config/config.js";
import userModel from "./user.js";
import propertyModel from "./property.js";
import propertyImageModel from "./property_image.js";
import amenityModel from "./amenity.js";
import propertyAmenityModel from "./property_amenity.js";
import bookmarkModel from "./bookmark.js";
import priceEstimateModel from "./price_estimate.js";
import reviewModel from "./review.js";

// Create a new Sequelize instance to connect to the database.
// This instance is the core of our database interactions.
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
  },
);

// Create an empty object to hold our database models and the Sequelize instance.
const db = {};

// Store the Sequelize library and the database connection instance in our db object.
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Initialize models
// Initialize each model by passing the sequelize connection object.
// This step links our model definitions to the actual database.
db.User = userModel(sequelize, Sequelize);
db.Property = propertyModel(sequelize, Sequelize);
db.PropertyImage = propertyImageModel(sequelize, Sequelize);
db.Amenity = amenityModel(sequelize, Sequelize);
db.PropertyAmenity = propertyAmenityModel(sequelize, Sequelize);
db.Bookmark = bookmarkModel(sequelize, Sequelize);
db.PriceEstimate = priceEstimateModel(sequelize, Sequelize);
db.Review = reviewModel(sequelize, Sequelize);

/* =========================
     USERS ↔ PROPERTIES
  ========================= */

db.User.hasMany(db.Property, {
  foreignKey: "seller_id",
  as: "properties",
});

db.Property.belongsTo(db.User, {
  foreignKey: "seller_id",
  as: "seller",
});

/* =========================
     PROPERTIES ↔ IMAGES
  ========================= */

db.Property.hasMany(db.PropertyImage, {
  foreignKey: "property_id",
  as: "images",
});

db.PropertyImage.belongsTo(db.Property, {
  foreignKey: "property_id",
  as: "property",
});

/* =========================
     PROPERTIES ↔ AMENITIES (M:N)
  ========================= */

db.Property.belongsToMany(db.Amenity, {
  through: db.PropertyAmenity,
  foreignKey: "property_id",
  otherKey: "amenity_id",
  as: "amenities",
});

db.Amenity.belongsToMany(db.Property, {
  through: db.PropertyAmenity,
  foreignKey: "amenity_id",
  otherKey: "property_id",
  as: "properties",
});

/* =========================
     USERS ↔ BOOKMARKS ↔ PROPERTIES
  ========================= */

db.User.hasMany(db.Bookmark, {
  foreignKey: "user_id",
  as: "bookmarks",
});

db.Bookmark.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});

db.Property.hasMany(db.Bookmark, {
  foreignKey: "property_id",
  as: "bookmarks",
});

db.Bookmark.belongsTo(db.Property, {
  foreignKey: "property_id",
  as: "property",
});

/* =========================
     PROPERTIES ↔ PRICE ESTIMATES
  ========================= */

db.Property.hasMany(db.PriceEstimate, {
  foreignKey: "property_id",
  as: "price_estimates",
});

db.PriceEstimate.belongsTo(db.Property, {
  foreignKey: "property_id",
  as: "property",
});

/* =========================
     USERS ↔ REVIEWS ↔ PROPERTIES
  ========================= */

db.User.hasMany(db.Review, {
  foreignKey: "reviewer_id",
  as: "reviews_given",
});

db.Review.belongsTo(db.User, {
  foreignKey: "reviewer_id",
  as: "reviewer",
});

db.Property.hasMany(db.Review, {
  foreignKey: "property_id",
  as: "reviews",
});

db.Review.belongsTo(db.Property, {
  foreignKey: "property_id",
  as: "property",
});

export default db;
