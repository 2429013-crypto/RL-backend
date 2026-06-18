const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Otp = require("../models/otp");
const User = require("../models/user");
const responseHandler = require("../../helper/responseHelper");

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingOtp = await Otp.findOne({ where: { email } });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    if (existingOtp) {
      const timeDiff = Date.now() - new Date(existingOtp.updatedAt).getTime();
      if (timeDiff < 30 * 1000) {
        return res
          .status(429)
          .json({ message: "Please wait 30 seconds before requesting OTP" });
      }

      existingOtp.otp = otp;
      existingOtp.expiresAt = expiresAt;
      existingOtp.isVerified = false;
      existingOtp.verificationToken = null;
      await existingOtp.save();

      return res.status(200).json({ message: "OTP sent successfully", otp });
    }

    await Otp.create({
      email,
      otp,
      expiresAt,
      isVerified: false,
      verificationToken: null,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingOtp = await Otp.findOne({ where: { email } });
    if (!existingOtp) {
      return res.status(404).json({ message: "Please request OTP first" });
    }

    const timeDiff = Date.now() - new Date(existingOtp.updatedAt).getTime();
    if (timeDiff < 30 * 1000) {
      return res
        .status(429)
        .json({ message: "Please wait 30 seconds before requesting OTP" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    existingOtp.otp = otp;
    existingOtp.expiresAt = expiresAt;
    existingOtp.isVerified = false;
    existingOtp.verificationToken = null;
    await existingOtp.save();

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
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

    const verificationToken = crypto.randomBytes(32).toString("hex");

    otpRecord.isVerified = true;
    otpRecord.verificationToken = verificationToken;
    await otpRecord.save();

    return res
      .status(200)
      .json({ message: "OTP verified successfully", verificationToken });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
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
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpRecord = await Otp.findOne({
      where: { email, verificationToken, isVerified: true },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid verification" });
    }

    const tokenAge = Date.now() - new Date(otpRecord.updatedAt).getTime();
    if (tokenAge > 10 * 60 * 1000) {
      return res.status(400).json({ message: "Verification token expired" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
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
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    req.session.userId = user.id;
    req.session.isLoggedIn = true;
    req.session.role = user.role;

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("redlink_session");
    return res.status(200).json({ message: "Logged out successfully" });
  });
};

const getCurrentUser = async (req, res) => {
  try {

    if (!req.session.isLoggedIn) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findByPk(req.session.userId, {
      attributes: [
        "id",
        "email",
        "phoneNumber",
        "state",
        "districtName",
        "pinCode",
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return responseHandler(res = res, status = 200, message = "User fetched successfully", data = user);
  } catch (error) {
    console.log("Error fetching current user:", error);
    return responseHandler(res, 500, error.message, null, false);
  }
};

module.exports = {
  sendOtp,
  resendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
};
