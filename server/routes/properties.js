import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import db from "../models/index.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/media_upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

//localhost:8090/api/properties/...

//Get All Properties
router.get("/", async (req, res) => {
  try {
    // Add pagination with query params ?page=1&limit=10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const properties = await db.Property.findAndCountAll({
      offset,
      limit,
      attributes: [
        "id",
        "description",
        "property_type",
        "bedrooms",
        "bathrooms",
        "size_sqm",
        "price",
        "status",
        "county",
        "subcounty",
        "latitude",
        "longitude",
        "createdAt",
      ],
      include: [
        {
          model: db.User,
          as: "seller",
          attributes: [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile_picture_url",
          ],
        },
        {
          model: db.PropertyImage,
          as: "images",
          attributes: ["id", "image_url", "image_type", "display_order"],
        },
        {
          model: db.Amenity,
          as: "amenities",
          attributes: ["id", "name"],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: db.Review,
          as: "reviews",
          attributes: ["id", "rating", "review_text"],
          include: [
            {
              model: db.User,
              as: "reviewer",
              attributes: [
                "id",
                "username",
                "first_name",
                "profile_picture_url",
              ],
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"],
      ],
    });

    res.status(200).send({
      total: properties.count,
      page,
      limit,
      pages: Math.ceil(properties.count / limit),
      data: properties.rows,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Filter properties by query parameters
router.get("/filters", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const toNumber = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const addRangeFilter = (field, minValue, maxValue, where) => {
      const min = toNumber(minValue);
      const max = toNumber(maxValue);
      if (min !== null && max !== null) {
        where[field] = { [Op.between]: [min, max] };
      } else if (min !== null) {
        where[field] = { [Op.gte]: min };
      } else if (max !== null) {
        where[field] = { [Op.lte]: max };
      }
    };

    const where = {};

    if (req.query.property_type) {
      where.property_type = req.query.property_type;
    }

    if (req.query.county) {
      where.county = { [Op.like]: `%${req.query.county}%` };
    }

    if (req.query.subcounty) {
      where.subcounty = { [Op.like]: `%${req.query.subcounty}%` };
    }

    if (req.query.location) {
      where[Op.or] = [
        { county: { [Op.like]: `%${req.query.location}%` } },
        { subcounty: { [Op.like]: `%${req.query.location}%` } },
      ];
    }

    addRangeFilter("bedrooms", req.query.min_bedrooms, req.query.max_bedrooms, where);
    addRangeFilter("bathrooms", req.query.min_bathrooms, req.query.max_bathrooms, where);
    addRangeFilter("size_sqm", req.query.min_size_sqm, req.query.max_size_sqm, where);
    addRangeFilter(
      "land_size_sqm",
      req.query.min_land_size_sqm,
      req.query.max_land_size_sqm,
      where,
    );
    addRangeFilter("floors", req.query.min_floors, req.query.max_floors, where);
    addRangeFilter("price", req.query.min_price, req.query.max_price, where);

    const lat = toNumber(req.query.lat);
    const lng = toNumber(req.query.lng);
    if (lat !== null && lng !== null) {
      const radiusKm = toNumber(req.query.radius_km) ?? 5;
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

      where.latitude = { [Op.between]: [lat - latDelta, lat + latDelta] };
      where.longitude = { [Op.between]: [lng - lngDelta, lng + lngDelta] };
    }

    let amenityIds = [];
    if (req.query.amenity_ids) {
      if (Array.isArray(req.query.amenity_ids)) {
        amenityIds = req.query.amenity_ids.map((id) => Number(id)).filter(Number.isInteger);
      } else {
        amenityIds = String(req.query.amenity_ids)
          .split(",")
          .map((id) => Number(id.trim()))
          .filter(Number.isInteger);
      }
    }

    if (amenityIds.length > 0) {
      const matchingPropertyIds = await db.PropertyAmenity.findAll({
        where: { amenity_id: amenityIds },
        attributes: ["property_id"],
        group: ["property_id"],
        having: db.sequelize.where(
          db.sequelize.fn("COUNT", db.sequelize.fn("DISTINCT", db.sequelize.col("amenity_id"))),
          amenityIds.length,
        ),
      });

      const propertyIds = matchingPropertyIds.map((row) => row.property_id);
      if (propertyIds.length === 0) {
        return res.status(200).json({
          total: 0,
          page,
          limit,
          pages: 0,
          data: [],
        });
      }
      where.id = { [Op.in]: propertyIds };
    }

    const properties = await db.Property.findAndCountAll({
      where,
      offset,
      limit,
      distinct: true,
      attributes: [
        "id",
        "description",
        "property_type",
        "bedrooms",
        "bathrooms",
        "size_sqm",
        "land_size_sqm",
        "floors",
        "price",
        "status",
        "county",
        "subcounty",
        "latitude",
        "longitude",
        "createdAt",
      ],
      include: [
        {
          model: db.User,
          as: "seller",
          attributes: [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile_picture_url",
          ],
        },
        {
          model: db.PropertyImage,
          as: "images",
          attributes: ["id", "image_url", "image_type", "display_order"],
        },
        {
          model: db.Amenity,
          as: "amenities",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        {
          model: db.Review,
          as: "reviews",
          attributes: ["id", "rating", "review_text"],
          include: [
            {
              model: db.User,
              as: "reviewer",
              attributes: ["id", "username", "first_name", "profile_picture_url"],
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"],
      ],
    });

    res.status(200).json({
      total: properties.count,
      page,
      limit,
      pages: Math.ceil(properties.count / limit),
      data: properties.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single property by ID
router.get("/:id", async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id, {
      attributes: [
        "id",
        "description",
        "property_type",
        "bedrooms",
        "bathrooms",
        "size_sqm",
        "land_size_sqm",
        "floors",
        "year_built",
        "condition",
        "county",
        "subcounty",
        "latitude",
        "longitude",
        "predicted_price",
        "price",
        "status",
        "createdAt",
      ],
      include: [
        {
          model: db.User,
          as: "seller",
          attributes: [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile_picture_url",
          ],
        },
        {
          model: db.PropertyImage,
          as: "images",
          attributes: ["id", "image_url", "image_type", "display_order"],
        },
        {
          model: db.Amenity,
          as: "amenities",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        {
          model: db.Review,
          as: "reviews",
          attributes: ["id", "rating", "review_text", "createdAt"],
          include: [
            {
              model: db.User,
              as: "reviewer",
              attributes: [
                "id",
                "username",
                "first_name",
                "profile_picture_url",
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"],
      ],
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json({ data: property });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Create new property
router.post("/", auth, async (req, res) => {
  try {
    // Extract seller_id from authenticated user
    const seller_id = req.user.id;

    // Create property with authenticated user as seller
    const property = await db.Property.create({
      seller_id,
      description: req.body.description,
      property_type: req.body.property_type,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      size_sqm: req.body.size_sqm,
      land_size_sqm: req.body.land_size_sqm,
      floors: req.body.floors,
      year_built: req.body.year_built,
      condition: req.body.condition,
      county: req.body.county,
      subcounty: req.body.subcounty,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      predicted_price: req.body.predicted_price,
      price: req.body.price,
      status: req.body.status || "For Sale", // Default to "For Sale"
    });

    res.status(201).json({
      property_id: property.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add amenities to a property
router.post("/:id/amenities", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only add amenities to your own properties" });
    }

    // Validate amenity_ids array
    if (!req.body.amenity_ids || !Array.isArray(req.body.amenity_ids)) {
      return res.status(400).json({ error: "amenity_ids must be an array" });
    }

    // Validate that all amenity IDs exist in the database
    if (req.body.amenity_ids.length > 0) {
      const validAmenities = await db.Amenity.findAll({
        where: { id: req.body.amenity_ids },
        attributes: ["id"],
      });

      const validIds = validAmenities.map((amenity) => amenity.id);
      const invalidIds = req.body.amenity_ids.filter(
        (id) => !validIds.includes(id),
      );

      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: `Invalid amenity IDs: ${invalidIds.join(", ")}. These amenities do not exist.`,
        });
      }
    }

    // Add amenities to property (replaces existing amenities)
    await property.setAmenities(req.body.amenity_ids);

    // Fetch updated property with amenities
    const updatedProperty = await db.Property.findByPk(property.id, {
      include: [
        {
          model: db.Amenity,
          as: "amenities",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    res.status(200).json({
      message: "Amenities added successfully",
      data: updatedProperty,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add images to a property
router.post(
  "/:id/images",
  auth,
  upload.array("images", 15),
  async (req, res) => {
    try {
      const property = await db.Property.findByPk(req.params.id);

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Check if user owns this property
      if (property.seller_id !== req.user.id) {
        return res
          .status(403)
          .json({ error: "You can only add images to your own properties" });
      }

      // Validate if there are images present
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      // Parse image types from request body (sent as JSON array)
      let imageTypes = [];
      if (req.body.image_types) {
        imageTypes = typeof req.body.image_types === "string" 
          ? JSON.parse(req.body.image_types) 
          : req.body.image_types;
      }

      // Create multiple property images with individual types
      const imagePromises = req.files.map((file, index) =>
        db.PropertyImage.create({
          property_id: property.id,
          image_url: `/uploads/properties/${file.filename}`,
          image_type: imageTypes[index] || "normal",
          display_order: index,
        }),
      );

      await Promise.all(imagePromises);

      // Fetch complete property with all relationships for final response
      const completeProperty = await db.Property.findByPk(property.id, {
        attributes: [
          "id",
          "description",
          "property_type",
          "bedrooms",
          "bathrooms",
          "size_sqm",
          "land_size_sqm",
          "floors",
          "year_built",
          "condition",
          "county",
          "subcounty",
          "latitude",
          "longitude",
          "price",
          "status",
          "createdAt",
        ],
        include: [
          {
            model: db.User,
            as: "seller",
            attributes: [
              "id",
              "username",
              "email",
              "first_name",
              "last_name",
              "profile_picture_url",
            ],
          },
          {
            model: db.PropertyImage,
            as: "images",
            attributes: ["id", "image_url", "image_type", "display_order"],
          },
          {
            model: db.Amenity,
            as: "amenities",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        order: [
          [{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"],
        ],
      });

      res.status(201).json({
        message: "Images uploaded successfully!",
        data: completeProperty,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Update basic property information
router.put("/:id", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({
        error: "You can only update your own properties",
      });
    }

    // Update property with new values
    await property.update({
      description: req.body.description || property.description,
      property_type: req.body.property_type || property.property_type,
      bedrooms:
        req.body.bedrooms !== undefined ? req.body.bedrooms : property.bedrooms,
      bathrooms:
        req.body.bathrooms !== undefined
          ? req.body.bathrooms
          : property.bathrooms,
      size_sqm: req.body.size_sqm || property.size_sqm,
      land_size_sqm: req.body.land_size_sqm || property.land_size_sqm,
      floors: req.body.floors !== undefined ? req.body.floors : property.floors,
      year_built: req.body.year_built || property.year_built,
      condition: req.body.condition || property.condition,
      county: req.body.county || property.county,
      subcounty: req.body.subcounty || property.subcounty,
      latitude:
        req.body.latitude !== undefined ? req.body.latitude : property.latitude,
      longitude:
        req.body.longitude !== undefined
          ? req.body.longitude
          : property.longitude,
      predicted_price: req.body.predicted_price || property.predicted_price,
      price: req.body.price || property.price,
      status: req.body.status || property.status,
    });

    res.status(200).json({
      message: "Property updated successfully",
      property_id: property.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update property amenities
router.put("/:id/amenities", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({
        error: "You can only update amenities for your own properties",
      });
    }

    // Validate amenity_ids array
    if (!req.body.amenity_ids || !Array.isArray(req.body.amenity_ids)) {
      return res.status(400).json({ error: "amenity_ids must be an array" });
    }

    // Validate that all amenity IDs exist in the database
    if (req.body.amenity_ids.length > 0) {
      const validAmenities = await db.Amenity.findAll({
        where: { id: req.body.amenity_ids },
        attributes: ["id"],
      });

      const validIds = validAmenities.map((amenity) => amenity.id);
      const invalidIds = req.body.amenity_ids.filter(
        (id) => !validIds.includes(id),
      );

      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: `Invalid amenity IDs: ${invalidIds.join(", ")}. These amenities do not exist.`,
        });
      }
    }

    // Replace existing amenities with new ones
    await property.setAmenities(req.body.amenity_ids);

    // Fetch updated property with amenities
    const updatedProperty = await db.Property.findByPk(property.id, {
      include: [
        {
          model: db.Amenity,
          as: "amenities",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    res.status(200).json({
      message: "Amenities updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add images to a property (does NOT delete existing images)
router.put(
  "/:id/images",
  auth,
  upload.array("images", 15),
  async (req, res) => {
    try {
      const property = await db.Property.findByPk(req.params.id);

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Check if user owns this property
      if (property.seller_id !== req.user.id) {
        return res.status(403).json({
          error: "You can only add images to your own properties",
        });
      }

      // Validate if there are images present
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      // Get the current count of images to set display_order
      const existingImages = await db.PropertyImage.count({
        where: { property_id: property.id },
      });

      // Validate total images don't exceed 15
      const totalImages = existingImages + req.files.length;
      if (totalImages > 15) {
        return res.status(400).json({
          error: `Cannot add ${req.files.length} image(s). You have ${existingImages} existing image(s). Maximum allowed is 15 images total. You can add up to ${15 - existingImages} more image(s).`,
        });
      }

      // Parse image types from request body (sent as JSON array)
      let imageTypes = [];
      if (req.body.image_types) {
        imageTypes = typeof req.body.image_types === "string" 
          ? JSON.parse(req.body.image_types) 
          : req.body.image_types;
      }

      // Create new images from uploaded files with individual types (adds to existing)
      const imagePromises = req.files.map((file, index) =>
        db.PropertyImage.create({
          property_id: property.id,
          image_url: `/uploads/properties/${file.filename}`,
          image_type: imageTypes[index] || "normal",
          display_order: existingImages + index,
        }),
      );

      await Promise.all(imagePromises);

      // Fetch complete property with all relationships for final response
      const completeProperty = await db.Property.findByPk(property.id, {
        attributes: [
          "id",
          "description",
          "property_type",
          "bedrooms",
          "bathrooms",
          "size_sqm",
          "land_size_sqm",
          "floors",
          "year_built",
          "condition",
          "county",
          "subcounty",
          "latitude",
          "longitude",
          "price",
          "status",
          "createdAt",
        ],
        include: [
          {
            model: db.User,
            as: "seller",
            attributes: [
              "id",
              "username",
              "email",
              "first_name",
              "last_name",
              "profile_picture_url",
            ],
          },
          {
            model: db.PropertyImage,
            as: "images",
            attributes: ["id", "image_url", "image_type", "display_order"],
          },
          {
            model: db.Amenity,
            as: "amenities",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        order: [
          [{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"],
        ],
      });

      res.status(200).json({
        message: `${req.files.length} image(s) added successfully!`,
        data: completeProperty,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Delete a specific image by ID
router.delete("/:id/images/:imageId", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({
        error: "You can only delete images from your own properties",
      });
    }

    // Find the image
    const image = await db.PropertyImage.findByPk(req.params.imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Verify image belongs to this property
    if (image.property_id !== property.id) {
      return res.status(403).json({ error: "This image does not belong to this property" });
    }

    // Extract filename from image_url (e.g., "/uploads/properties/filename.jpg" -> "filename.jpg")
    const filename = path.basename(image.image_url);
    const filePath = path.join(__dirname, "..", "uploads", "properties", filename);

    // Delete physical file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete image record from database
    await image.destroy();

    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete all images for a property
router.delete("/:id/images", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({
        error: "You can only delete images from your own properties",
      });
    }

    // Get all images for this property
    const images = await db.PropertyImage.findAll({
      where: { property_id: property.id },
    });

    // Delete physical files from disk
    images.forEach((image) => {
      const filename = path.basename(image.image_url);
      const filePath = path.join(__dirname, "..", "uploads", "properties", filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Delete all image records from database
    await db.PropertyImage.destroy({
      where: { property_id: property.id },
    });

    res.status(200).json({
      message: `${images.length} image(s) deleted successfully`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a property
router.delete("/:id", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({
        error: "You can only delete your own properties",
      });
    }

    // Delete the property (cascades to images, amenities, bookmarks, reviews, price_estimates)
    await property.destroy();

    res.status(200).json({
      message: "Property deleted successfully",
      property_id: property.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
