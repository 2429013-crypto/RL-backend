const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const User = require("../models/User");
const Otp = require("../models/Otp");

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingOtp = await Otp.findOne({ where: { email } });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    console.log("Generated OTP:", otp);

    if (existingOtp) {
      const timeDiff = Date.now() - new Date(existingOtp.updatedAt).getTime();

      if (timeDiff < 30 * 1000) {
        return res.status(429).json({
          message: "Please wait 30 seconds before requesting OTP",
        });
      }

      existingOtp.otp = otp;
      existingOtp.expiresAt = expiresAt;
      existingOtp.isVerified = false;

      await existingOtp.save();

      return res.status(200).json({
        message: "OTP sent successfully",
        otp, // For testing purposes, remove in production
      });
    }
    const otpData = await Otp.create({
      email,
      otp,
      expiresAt,
      isVerified: false,
    });

    console.log("Saved OTP:", otpData.toJSON());

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const existingOtp = await Otp.findOne({
      where: { email },
    });

    if (!existingOtp) {
      return res.status(404).json({
        message: "Please request OTP first",
      });
    }

    const timeDiff = Date.now() - new Date(existingOtp.updatedAt).getTime();

    if (timeDiff < 30 * 1000) {
      return res.status(429).json({
        message: "Please wait 30 seconds before requesting OTP",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    existingOtp.otp = otp;
    existingOtp.expiresAt = expiresAt;
    existingOtp.isVerified = false;

    await existingOtp.save();

    console.log("Resent OTP:", otp);

    return res.status(200).json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({
      where: { email },
      order: [["updatedAt", "DESC"]],
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "No OTP found" });
    }

    if (otpRecord.isVerified) {
      return res.status(400).json({ message: "OTP already used" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otpRecord.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpRecord = await Otp.findOne({ where: { email } });

    if (!otpRecord || !otpRecord.isVerified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
