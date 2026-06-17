const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
} = require("../controllers/requestController");

router.post("/", protect, createRequest);
router.get("/", getAllRequests);
router.get("/my-requests", protect, getMyRequests);
router.get("/:id", getRequestById);
router.patch("/:id/status", protect, updateRequestStatus);

module.exports = router;