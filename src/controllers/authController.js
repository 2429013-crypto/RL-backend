const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Otp = require("../models/otp");
const User = require("../models/user");
const responseHandler = require("../../helper/responseHelper");
const sendEmail = require("../../helper/mailHandler");
const { otpTemplate } = require("../../templates/otpTemplate");
const { verifiedTemplate } = require("../../templates/verifiedTemplate");
const { welcomeTemplate } = require("../../templates/welcomeTemplate");

// ── Send OTP ──────────────────────────────────────────────────────────────────
const sendOtp = async (req, res) => {
  try {
    console.log("sendOtp route hit");
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // const existingOtp = await Otp.findOne({ where: { email } });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    // if (existingOtp) {
    //   const timeDiff = Date.now() - new Date(existingOtp.updatedAt).getTime();
    //   if (timeDiff < 30 * 1000) {
    //     return res
    //       .status(429)
    //       .json({ message: "Please wait 30 seconds before requesting OTP" });
    //   }

    //   existingOtp.otp = otp;
    //   existingOtp.expiresAt = expiresAt;
    //   existingOtp.isVerified = false;
    //   existingOtp.verificationToken = null;
    //   await existingOtp.save();

    //   return res.status(200).json({ message: "OTP sent successfully", otp });
    // }

    await Otp.create({
      email,
      otp,
      expiresAt,
      isVerified: false,
      verificationToken: null,
    });

    const emailHtml = otpTemplate(otp);

    const sent = await sendEmail(email, "OTP Verification", emailHtml);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// ── Resend ──────────────────────────────────────────────────────────────────
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

    const emailHtml = otpTemplate(otp);

    const sent = await sendEmail(email, "OTP Verification", emailHtml);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP",
      });
    }

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// ── verify OTP ──────────────────────────────────────────────────────────────────
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

    if (Date.now() > new Date(otpRecord.expiresAt).getTime()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otpRecord.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    otpRecord.isVerified = true;
    otpRecord.verificationToken = verificationToken;
    await otpRecord.save();
    try {
      const emailHtml = verifiedTemplate();
      await sendEmail(email, "Email Verified ✅ — RedLink", emailHtml);
    } catch (emailErr) {
      console.error("[RedLink] Verified email error:", emailErr);
    }

    return res
      .status(200)
      .json({ message: "OTP verified successfully", verificationToken });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// ── REGISTER ──────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { email, password, verificationToken } = req.body;

    if (!email || !password || !verificationToken) {
      return res.status(400).json({
        message: "Email, password and verification token are required",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return res.status(400).json({
        message: "Password can only contain letters and numbers",
      });
    }

    const otpRecord = await Otp.findOne({
      where: { email, verificationToken, isVerified: true },
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired verification. Please verify OTP again.",
      });
    }

    const tokenAge = Date.now() - new Date(otpRecord.updatedAt).getTime();
    if (tokenAge > 10 * 60 * 1000) {
      return res.status(400).json({
        message: "Verification token expired. Please verify OTP again.",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const emailHtml = welcomeTemplate(user.email);
    await sendEmail(user.email, "Welcome to RedLink 🩸", emailHtml);

    await otpRecord.destroy();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
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

    req.session.isLoggedIn = true;
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
    };

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
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("redlink_session");
    return res.status(200).json({ message: "Logged out successfully" });
  });
};

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "email", "isOnboarded", "role"],
    });

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
    };

    return res.status(200).json({
      success: true,
      data: userData,
      user: userData,
    });
  } catch (error) {
    console.log("Error fetching current user:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    console.log("otp", otp);

    const existingOtp = await Otp.findOne({ where: { email } });
    if (existingOtp) {
      existingOtp.otp = otp;
      existingOtp.expiresAt = expiresAt;
      existingOtp.isVerified = false;
      existingOtp.verificationToken = null;
      await existingOtp.save();
    } else {
      await Otp.create({
        email,
        otp,
        expiresAt,
        isVerified: false,
        verificationToken: null,
      });
    }

    const emailHtml = otpTemplate(otp);
    const sent = await sendEmail(
      email,
      "Password Reset OTP - RedLink",
      emailHtml,
    );
    console.log("sent", sent);
    console.log("email", email);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Password reset OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── VERIFY RESET OTP ──────────────────────────────────────────────────────────
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRecord = await Otp.findOne({
      where: { email },
      order: [["createdAt", "DESC"]],
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "No OTP found" });
    }

    if (Date.now() > new Date(otpRecord.expiresAt).getTime()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }
    if (otpRecord.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    otpRecord.isVerified = true;
    otpRecord.verificationToken = verificationToken;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      verificationToken,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, verificationToken, newPassword } = req.body;

    if (!email || !verificationToken || !newPassword) {
      return res.status(400).json({
        message: "Email, verification token, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
      return res.status(400).json({
        message: "Password can only contain letters and numbers",
      });
    }

    const otpRecord = await Otp.findOne({
      where: { email, verificationToken, isVerified: true },
    });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "Invalid or expired token. Please start over." });
    }

    const tokenAge = Date.now() - new Date(otpRecord.updatedAt).getTime();
    if (tokenAge > 10 * 60 * 1000) {
      return res
        .status(400)
        .json({ message: "Token expired. Please start over." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await otpRecord.destroy();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
