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
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);

module.exports = router;