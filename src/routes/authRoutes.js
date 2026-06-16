const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { verify_otp } = require("../controllers/authController");

router.post("/send-otp", async (req, res) => { 
    console.log("SEND OTP ROUTE HIT");
  console.log(req.body);


  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingOtp = await Otp.findOne({ where: { email } });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
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
      existingOtp.verificationToken = null;

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
      verificationToken: null,
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
    existingOtp.verificationToken = null;

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
  verify_otp(req, res);
});

router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      phoneNumber,
      state,
      districtName,
      pinCode,
      verificationToken,
    } = req.body;

    if (
      !email ||
      !password ||
      !phoneNumber ||
      !state ||
      !districtName ||
      !pinCode ||
      !verificationToken
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const otpRecord = await Otp.findOne({
      where: {
        email,
        verificationToken,
        isVerified: true,
      }, 
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid verification",
      });
    }

    const tokenAge = Date.now() - new Date(otpRecord.updatedAt).getTime();

    if (tokenAge > 10 * 60 * 1000) {
      return res.status(400).json({
        message: "Verification token expireds",
      }); 
    }

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      phoneNumber,
      state,
      districtName,
      pinCode,
    });

    await otpRecord.destroy();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        state: user.state,
        districtName: user.districtName,
        pinCode: user.pinCode,
      },
    });
  } catch (error) {                                      
    return res.status(500).json({
      message: error.message,
    });
  }
});                                                 
router.post("/login", async (req, res) => { 
  console.log("LOGIN ROUTE HIT"); 
  console.log(req.body); 
  try {
    const { email, password } = req.body;

    if (!email || !password) { 
      return res.status(400).json({
        message: "Email and password are required",
      }); 
    }

        const user = await User.findOne({ where: { email }, });

   if (!user) {
      return res.status(404).json({
        message: "User not found",
      }); 
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email, 
      //  name: user.name
  //         phoneNumber: user.phoneNumber,
  // state: user.state,
  // districtName: user.districtName,
  // pinCode: user.pinCode,

        },                 
    });   
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });                                              
  }
});          
module.exports = router;   
                                 
                                              