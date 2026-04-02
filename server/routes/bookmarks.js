import express from 'express';
import db from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

//localhost:8090/api/bookmarks/...

// Get all bookmarks for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const bookmarks = await db.Bookmark.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: db.Property,
          as: 'property',
          attributes: [
            'id',
            'description',
            'property_type',
            'bedrooms',
            'bathrooms',
            'size_sqm',
            'price',
            'status',
            'county',
            'subcounty',
            'latitude',
            'longitude',
            'createdAt'
          ],
          include: [
            {
              model: db.User,
              as: 'seller',
              attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'profile_picture_url']
            },
            {
              model: db.PropertyImage,
              as: 'images',
              attributes: ['id', 'image_url', 'image_type', 'display_order']
            },
            {
              model: db.Amenity,
              as: 'amenities',
              attributes: ['id', 'name'],
              through: { attributes: [] }
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      total: bookmarks.length,
      data: bookmarks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a property is bookmarked by the logged-in user
router.get('/check/:property_id', auth, async (req, res) => {
  try {
    const bookmark = await db.Bookmark.findOne({
      where: {
        user_id: req.user.id,
        property_id: req.params.property_id
      }
    });

    res.status(200).json({
      is_bookmarked: !!bookmark,
      bookmark_id: bookmark ? bookmark.id : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a property to bookmarks (toggle on)
router.post('/', auth, async (req, res) => {
  try {
    const property_id = req.body.property_id;

    // Check if property exists
    const property = await db.Property.findByPk(property_id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if already bookmarked
    const existingBookmark = await db.Bookmark.findOne({
      where: {
        user_id: req.user.id,
        property_id: property_id
      }
    });

    if (existingBookmark) {
      return res.status(400).json({ 
        error: "Property already bookmarked",
        bookmark_id: existingBookmark.id
      });
    }

    // Create bookmark
    const bookmark = await db.Bookmark.create({
      user_id: req.user.id,
      property_id: property_id
    });

    res.status(201).json({
      message: "Property bookmarked successfully",
      data: bookmark
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove a property from bookmarks (by property_id)
router.delete('/property/:property_id', auth, async (req, res) => {
  try {
    const bookmark = await db.Bookmark.findOne({
      where: {
        user_id: req.user.id,
        property_id: req.params.property_id
      }
    });

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    await bookmark.destroy();

    res.status(200).json({
      message: "Bookmark removed successfully",
      property_id: parseInt(req.params.property_id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a bookmark (by bookmark_id)
router.delete('/:id', auth, async (req, res) => {
  try {
    const bookmark = await db.Bookmark.findByPk(req.params.id);

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    // Check if user owns this bookmark
    if (bookmark.user_id !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own bookmarks" });
    }

    await bookmark.destroy();

    res.status(200).json({
      message: "Bookmark removed successfully",
      bookmark_id: bookmark.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;