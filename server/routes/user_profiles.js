import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../models/index.js";
import auth from "../middleware/auth.js";
import { profileUpload } from "../middleware/media_upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

//localhost:8090/api/user_profiles

// Get current logged-in user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: [
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "bio",
        "profile_picture_url",
        "createdAt",
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile fields completed after registration
router.put("/me", auth, async (req, res) => {
  try {
    const allowedUpdates = ["first_name", "last_name", "phone_number", "bio"];
    const updates = {};

    for (const field of allowedUpdates) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const [updatedRows] = await db.User.update(updates, {
      where: { id: req.user.id },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await db.User.findByPk(req.user.id, {
      attributes: [
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "bio",
        "profile_picture_url",
        "createdAt",
      ],
    });

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload or replace profile picture
router.put(
  "/me/profile-picture",
  auth,
  profileUpload.single("profile_picture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No profile picture uploaded" });
      }

      const user = await db.User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete old profile picture from disk when replacing
      if (user.profile_picture_url) {
        const oldFilename = path.basename(user.profile_picture_url);
        const oldPath = path.join(
          __dirname,
          "..",
          "uploads",
          "profilepictures",
          oldFilename,
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const profilePictureUrl = `/uploads/profilepictures/${req.file.filename}`;
      await user.update({ profile_picture_url: profilePictureUrl });

      res.status(200).json({
        message: "Profile picture updated successfully",
        data: {
          id: user.id,
          profile_picture_url: profilePictureUrl,
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

export default router;
