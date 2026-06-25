const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Added to handle file deletion on profile delete
const Profile = require("../models/profile");
const User = require("../models/user");
const authorizeRole = require("../middleware/authorizeRole");
const ROLES = require("../constants/roles");
const protect = require("../middleware/authMiddleware");
// MULTER CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
//   only allow images, reject other file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed"));
  }
};
//  Added file size limit (2MB) to prevent huge uploads from crashing the server
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});
//  CREATE PROFILE
router.post(
  "/create",
  protect,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const {
        fullName,
        dateOfBirth,
        gender,
        bloodGroup,
        occupation,
        address,
        city,
        state,
        pinCode,
        weight,
        medicalConditions,
        currentMedications,
        lastDonationDate,
        receiveAlerts,
        volunteerParticipation,
      } = req.body;

      

      // Get userId from session
      const userId = req.session.user.id;

      // Validate fields
      if (!fullName || !bloodGroup) {
        return res.status(400).json({
          message: "Full name and blood group are required fields",
        });
      }
      const profilePhoto = req.file ? req.file.filename : null;

      const existingProfile = await Profile.findOne({ where: { userId } });
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const profile = await Profile.create({
        userId,
        fullName,
        dateOfBirth,
        gender,
        bloodGroup,
        occupation,
        profilePhoto,

        address,
        city,
        state,
        pinCode,

        weight: weight ? parseFloat(weight) : null,

        medicalConditions,
        currentMedications,
        lastDonationDate,

        receiveAlerts: receiveAlerts === "true" || receiveAlerts === true,
        volunteerParticipation:
          volunteerParticipation === "true" || volunteerParticipation === true,
      });

      if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
      if (req.body.districtName) user.districtName = req.body.districtName;
      user.isOnboarded = true;
      await user.save();
      //  Return full profilePhoto URL so frontend can directly use it
      return res.status(201).json({
        message: "Profile created successfully",
        profile: {
          ...profile.toJSON(),
          profilePhoto: profilePhoto
            ? `${req.protocol}://${req.get("host")}/uploads/${profilePhoto}`
            : null,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);
//protect GET PROFILE
router.get(
  "/:userId",
  protect,
  authorizeRole(ROLES.USER, ROLES.ADMIN),
  async (req, res) => {
    try {
      const targetUserId = req.params.userId === "me" ? req.session.user.id : req.params.userId;
      if (
        req.session.user.id != targetUserId &&
        req.session.user.role !== ROLES.ADMIN
      ) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }

      const profile = await Profile.findOne({
        where: { userId: targetUserId },
        include: [
          {
            model: User,
            attributes: ["phoneNumber", "districtName", "email"],
          },
        ],
      });

      if (!profile) {
        return res.status(404).json({
          message: "Profile not found",
        });
      }

      return res.status(200).json({
        ...profile.toJSON(),
        profilePhoto: profile.profilePhoto
          ? `${req.protocol}://${req.get("host")}/uploads/${profile.profilePhoto}`
          : null,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);
//protect UPDATE PROFILE
router.put(
  "/update/:userId",
  protect,
  authorizeRole(ROLES.USER, ROLES.ADMIN),
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const targetUserId = req.params.userId === "me" ? req.session.user.id : req.params.userId;
      if (req.session.user.id != targetUserId) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }
      const profile = await Profile.findOne({
        where: { userId: targetUserId },
      });

      if (!profile) {
        return res.status(404).json({
          message: "Profile not found",
        });
      }

      // If a new photo is uploaded, delete the old one
      if (req.file) {
        if (profile.profilePhoto) {
          const oldPhotoPath = path.join("uploads", profile.profilePhoto);

          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }

        req.body.profilePhoto = req.file.filename;
      }

      if (req.body.phoneNumber || req.body.districtName) {
        const user = await User.findByPk(targetUserId);
        if (user) {
          if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
          if (req.body.districtName !== undefined) user.districtName = req.body.districtName;
          await user.save();
        }
      }

      await profile.update(req.body);

      const updatedProfile = await Profile.findOne({
        where: { userId: targetUserId },
        include: [
          {
            model: User,
            attributes: ["phoneNumber", "districtName", "email"],
          },
        ],
      });

      return res.status(200).json({
        message: "Profile updated successfully",
        profile: {
          ...updatedProfile.toJSON(),
          profilePhoto: updatedProfile.profilePhoto
            ? `${req.protocol}://${req.get("host")}/uploads/${updatedProfile.profilePhoto}`
            : null,
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);
//protect DELETE PROFILE
router.delete(
  "/delete/:userId",
  protect,
  authorizeRole(ROLES.USER, ROLES.ADMIN),

  async (req, res) => {
    try {
      const targetUserId = req.params.userId === "me" ? req.session.user.id : req.params.userId;
      if (
        req.session.user.id != targetUserId &&
        req.session.user.role !== ROLES.ADMIN
      ) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }

      const profile = await Profile.findOne({
        where: { userId: targetUserId },
      });

      if (!profile) {
        return res.status(404).json({
          message: "Profile not found",
        });
      }

      if (profile.profilePhoto) {
        const photoPath = path.join("uploads", profile.profilePhoto);

        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      await profile.destroy();

      return res.status(200).json({
        message: "Profile deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

module.exports = router;
