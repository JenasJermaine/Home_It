import express from "express";
import db from "../models/index.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET all scenes + hotspots for a property
router.get("/properties/:propertyId", async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const scenes = await db.PanoramicScene.findAll({
      where: { property_id: req.params.propertyId },
      attributes: [
        "id",
        "property_id",
        "name",
        "image_url",
        "pitch",
        "yaw",
        "hfov",
        "display_order",
      ],
      include: [
        {
          model: db.PanoramicHotspot,
          as: "hotspots",
          attributes: [
            "id",
            "scene_id",
            "target_scene_id",
            "type",
            "text",
            "pitch",
            "yaw",
          ],
        },
      ],
      order: [
        ["display_order", "ASC"],
        [{ model: db.PanoramicHotspot, as: "hotspots" }, "id", "ASC"],
      ],
    });

    res.status(200).json({ data: scenes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new scene for a property
router.post("/properties/:propertyId/scenes", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only add scenes to your own properties" });
    }

    const { name, image_url, pitch, yaw, hfov, display_order } = req.body;
    if (!name || !image_url) {
      return res.status(400).json({ error: "name and image_url are required" });
    }

    const scene = await db.PanoramicScene.create({
      property_id: req.params.propertyId,
      name,
      image_url,
      pitch,
      yaw,
      hfov,
      display_order,
    });

    res.status(201).json({ data: scene });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a scene
router.put("/scenes/:sceneId", auth, async (req, res) => {
  try {
    const scene = await db.PanoramicScene.findByPk(req.params.sceneId);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    const property = await db.Property.findByPk(scene.property_id, {
      attributes: ["id", "seller_id"],
    });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only update your own scenes" });
    }

    const updates = {};
    ["name", "image_url", "pitch", "yaw", "hfov", "display_order"].forEach(
      (field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      },
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    await scene.update(updates);
    res.status(200).json({ data: scene });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a scene
router.delete("/scenes/:sceneId", auth, async (req, res) => {
  try {
    const scene = await db.PanoramicScene.findByPk(req.params.sceneId);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    const property = await db.Property.findByPk(scene.property_id, {
      attributes: ["id", "seller_id"],
    });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own scenes" });
    }

    await scene.destroy();
    res.status(200).json({
      message: "Scene deleted successfully",
      scene_id: scene.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a hotspot for a scene
router.post("/scenes/:sceneId/hotspots", auth, async (req, res) => {
  try {
    const scene = await db.PanoramicScene.findByPk(req.params.sceneId);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    const property = await db.Property.findByPk(scene.property_id, {
      attributes: ["id", "seller_id"],
    });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only add hotspots to your own scenes" });
    }

    const { target_scene_id, type, text, pitch, yaw } = req.body;
    if (pitch === undefined || yaw === undefined) {
      return res.status(400).json({ error: "pitch and yaw are required" });
    }

    if (target_scene_id) {
      const targetScene = await db.PanoramicScene.findByPk(target_scene_id);
      if (!targetScene) {
        return res.status(400).json({ error: "target_scene_id is invalid" });
      }
      if (targetScene.property_id !== scene.property_id) {
        return res
          .status(400)
          .json({ error: "target_scene_id must belong to the same property" });
      }
    }

    const hotspot = await db.PanoramicHotspot.create({
      scene_id: scene.id,
      target_scene_id: target_scene_id || null,
      type,
      text,
      pitch,
      yaw,
    });

    res.status(201).json({ data: hotspot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a hotspot
router.put("/hotspots/:hotspotId", auth, async (req, res) => {
  try {
    const hotspot = await db.PanoramicHotspot.findByPk(req.params.hotspotId, {
      include: [{ model: db.PanoramicScene, as: "scene" }],
    });
    if (!hotspot) {
      return res.status(404).json({ error: "Hotspot not found" });
    }

    const property = await db.Property.findByPk(hotspot.scene.property_id, {
      attributes: ["id", "seller_id"],
    });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only update your own hotspots" });
    }

    if (req.body.target_scene_id !== undefined) {
      if (req.body.target_scene_id === null) {
        // allow clearing
      } else {
        const targetScene = await db.PanoramicScene.findByPk(
          req.body.target_scene_id,
        );
        if (!targetScene) {
          return res.status(400).json({ error: "target_scene_id is invalid" });
        }
        if (targetScene.property_id !== hotspot.scene.property_id) {
          return res
            .status(400)
            .json({ error: "target_scene_id must belong to the same property" });
        }
      }
    }

    const updates = {};
    ["target_scene_id", "type", "text", "pitch", "yaw"].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    await hotspot.update(updates);
    res.status(200).json({ data: hotspot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a hotspot
router.delete("/hotspots/:hotspotId", auth, async (req, res) => {
  try {
    const hotspot = await db.PanoramicHotspot.findByPk(req.params.hotspotId, {
      include: [{ model: db.PanoramicScene, as: "scene" }],
    });
    if (!hotspot) {
      return res.status(404).json({ error: "Hotspot not found" });
    }

    const property = await db.Property.findByPk(hotspot.scene.property_id, {
      attributes: ["id", "seller_id"],
    });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own hotspots" });
    }

    await hotspot.destroy();
    res.status(200).json({
      message: "Hotspot deleted successfully",
      hotspot_id: hotspot.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
