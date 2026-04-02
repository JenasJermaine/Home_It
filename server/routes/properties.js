import express from "express";
import db from "../models/index.js";
import auth from "../middleware/auth.js";

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
        [{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"]
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
      order: [[{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"]],
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
      return res.status(403).json({ error: "You can only add amenities to your own properties" });
    }

    // Validate amenity_ids array
    if (!req.body.amenity_ids || !Array.isArray(req.body.amenity_ids)) {
      return res.status(400).json({ error: "amenity_ids must be an array" });
    }

    // Validate that all amenity IDs exist in the database
    if (req.body.amenity_ids.length > 0) {
      const validAmenities = await db.Amenity.findAll({
        where: { id: req.body.amenity_ids },
        attributes: ['id']
      });

      const validIds = validAmenities.map(amenity => amenity.id);
      const invalidIds = req.body.amenity_ids.filter(id => !validIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({ 
          error: `Invalid amenity IDs: ${invalidIds.join(', ')}. These amenities do not exist.`
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
router.post("/:id/images", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({ error: "You can only add images to your own properties" });
    }

    // Validate images array
    if (!req.body.images || !Array.isArray(req.body.images)) {
      return res.status(400).json({ error: "images must be an array" });
    }

    // Create multiple property images
    const imagePromises = req.body.images.map((image, index) => {
      return db.PropertyImage.create({
        property_id: property.id,
        image_url: image.image_url,
        image_type: image.image_type || "normal",
        display_order: image.display_order || index,
      });
    });

    const createdImages = await Promise.all(imagePromises);

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
      order: [[{ model: db.PropertyImage, as: "images" }, "display_order", "ASC"]],
    });

    res.status(201).json({
      message: "Property listing completed successfully!",
      data: completeProperty,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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
        error: "You can only update your own properties" 
      });
    }

    // Update property with new values
    await property.update({
      description: req.body.description || property.description,
      property_type: req.body.property_type || property.property_type,
      bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : property.bedrooms,
      bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : property.bathrooms,
      size_sqm: req.body.size_sqm || property.size_sqm,
      land_size_sqm: req.body.land_size_sqm || property.land_size_sqm,
      floors: req.body.floors !== undefined ? req.body.floors : property.floors,
      year_built: req.body.year_built || property.year_built,
      condition: req.body.condition || property.condition,
      county: req.body.county || property.county,
      subcounty: req.body.subcounty || property.subcounty,
      latitude: req.body.latitude !== undefined ? req.body.latitude : property.latitude,
      longitude: req.body.longitude !== undefined ? req.body.longitude : property.longitude,
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
        error: "You can only update amenities for your own properties" 
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
        attributes: ['id']
      });

      const validIds = validAmenities.map(amenity => amenity.id);
      const invalidIds = req.body.amenity_ids.filter(id => !validIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({ 
          error: `Invalid amenity IDs: ${invalidIds.join(', ')}. These amenities do not exist.`
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

// Update property images
router.put("/:id/images", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({ 
        error: "You can only update images for your own properties" 
      });
    }

    // Validate images array
    if (!req.body.images || !Array.isArray(req.body.images)) {
      return res.status(400).json({ error: "images must be an array" });
    }

    // Delete existing images for this property
    await db.PropertyImage.destroy({
      where: { property_id: property.id }
    });

    // Create new images
    const imagePromises = req.body.images.map((image, index) => {
      return db.PropertyImage.create({
        property_id: property.id,
        image_url: image.image_url,
        image_type: image.image_type || "general",
        display_order: image.display_order !== undefined ? image.display_order : index,
      });
    });

    const updatedImages = await Promise.all(imagePromises);

    res.status(200).json({
      message: "Images updated successfully",
      data: updatedImages,
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
        error: "You can only delete your own properties" 
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
