const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");
const ROLES = require("../constants/roles");
const rateLimit = require("express-rate-limit");

const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  acceptRequest,
  getAcceptedDonors,
  cancelAcceptance,
} = require("../controllers/requestController");

const acceptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // only 5 attempts per IP in 15 min
  message: {
    message: "Too many attempts. Please wait 15 minutes before trying again.",
  },
});

router.post("/", protect, createRequest);
router.get("/", protect, getAllRequests);
router.get("/my-requests", protect, getMyRequests);
router.get("/:id", protect, getRequestById);
router.patch("/:id/status", protect, updateRequestStatus);
router.patch("/:id/accept", protect, acceptLimiter, acceptRequest);
router.delete("/:id/accept", protect, acceptLimiter, cancelAcceptance);
router.get("/:id/donors", protect, getAcceptedDonors);

module.exports = router;
