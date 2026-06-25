const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
