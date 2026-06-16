const crypto = require("crypto");
const Otp  = require("../models/otp");

const verify_otp = async (req, res) => {
  console.log("Verify OTP Request:", req.body);
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
    console.log("OTP Record:", otpRecord);
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

    return res.status(200).json({
      message: "OTP verified successfully",
      verificationToken,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verify_otp,
};