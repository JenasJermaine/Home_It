import express from 'express';
import db from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

//localhost:8090/api/amenities/...

// Get all amenities
router.get('/', async (req, res) => {
  try {
    const amenities = await db.Amenity.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      total: amenities.length,
      data: amenities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new amenity
router.post('/', auth, async (req, res) => {
  try {
    const amenity = await db.Amenity.create({
      name: req.body.name
    });

    res.status(201).json({
      message: "Amenity created successfully",
      data: amenity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an amenity
router.put('/:id', auth, async (req, res) => {
  try {
    const amenity = await db.Amenity.findByPk(req.params.id);

    if (!amenity) {
      return res.status(404).json({ error: "Amenity not found" });
    }

    // Update amenity name
    await amenity.update({
      name: req.body.name || amenity.name
    });

    res.status(200).json({
      message: "Amenity updated successfully",
      data: amenity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an amenity
router.delete('/:id', auth, async (req, res) => {
  try {
    const amenity = await db.Amenity.findByPk(req.params.id);

    if (!amenity) {
      return res.status(404).json({ error: "Amenity not found" });
    }

    await amenity.destroy();

    res.status(200).json({
      message: "Amenity deleted successfully",
      amenity_id: amenity.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;