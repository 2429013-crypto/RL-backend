const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");
const ROLES = require("../constants/roles");
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  acceptRequest,
  getAcceptedDonors,
} = require("../controllers/requestController");

router.post("/", protect, createRequest);
router.get("/", protect, getAllRequests);
router.get("/my-requests", protect, getMyRequests);
router.get("/:id", protect, getRequestById);
router.patch("/:id/status", protect, updateRequestStatus);
router.patch("/:id/accept", protect, acceptRequest);
router.get("/:id/donors", protect, getAcceptedDonors);

module.exports = router; 
