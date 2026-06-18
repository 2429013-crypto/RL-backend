const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Added to handle file deletion on profile delete
const Profile = require("../models/profile");
const User = require("../models/user");
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
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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

const userId = req.session.userId;
  //  catch missing required fields early before any DB call
    if (!fullName || !bloodGroup) {
  return res.status(400).json({
    message: "fullName and bloodGroup are required",
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

    user.profileCompleted = true;
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
});
//  GET PROFILE 
router.get("/:userId", protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { userId: req.params.userId },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
  // Return full photo URL in GET response too, not just the filename
    return res.status(200).json({
      ...profile.toJSON(),
      profilePhoto: profile.profilePhoto
        ? `${req.protocol}://${req.get("host")}/uploads/${profile.profilePhoto}`
        : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
//  UPDATE PROFILE 
router.put(
  "/update/:userId",
  protect, upload.single("profilePhoto"), async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { userId: req.params.userId },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
  //If a new photo is uploaded, delete the OLD photo file from disk
    //to prevent storage buildup over time
    if (req.file) {
      if (profile.profilePhoto) {
        const oldPhotoPath = path.join("uploads", profile.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      req.body.profilePhoto = req.file.filename; // attach new filename to update payload
    }

    await profile.update(req.body);

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        ...profile.toJSON(),
        profilePhoto: profile.profilePhoto
          ? `${req.protocol}://${req.get("host")}/uploads/${profile.profilePhoto}`
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//DELETE PROFILE 
router.delete(
  "/delete/:userId",
  protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { userId: req.params.userId },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
 if (profile.profilePhoto) {
      const photoPath = path.join("uploads", profile.profilePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await profile.destroy();

    return res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router; 