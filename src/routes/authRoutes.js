const express = require("express");
const router = express.Router();
const {
  sendOtp,
  resendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser, // add this
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", getCurrentUser); // add this

module.exports = router;