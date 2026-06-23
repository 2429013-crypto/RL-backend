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
} = require("../controllers/requestController");
router.post("/", protect, createRequest);
router.get("/", protect, getAllRequests);
router.get("/my-requests", protect, getMyRequests);
router.get("/:id", protect, getRequestById);
router.patch("/:id/status", protect, updateRequestStatus);
module.exports = router;
