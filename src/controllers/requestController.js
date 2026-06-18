const Request = require("../models/request");

const createRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsNeeded,
      hospitalName,
      contactNumber,
      location,
      priority,
      requiredBy,
    } = req.body;

    const userId = req.session.userId; 

    // Required Fields
    if (
      !patientName ||
      !bloodGroup ||
      !unitsNeeded ||
      !hospitalName ||
      !contactNumber ||
      !location ||
      !priority ||
      !requiredBy
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Patient Name Validation
    const nameRegex = /^[a-zA-Z ]+$/;

    if (!nameRegex.test(patientName.trim())) {
      return res.status(400).json({
        message: "Patient name should contain only letters and spaces",
      });
    }

    // Hospital Name Validation
    if (hospitalName.trim().length < 3) {
      return res.status(400).json({
        message: "Hospital name must be at least 3 characters long",
      });
    }

    // Contact Number Validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({
        message: "Invalid contact number",
      });
    }

    // Blood Group Validation
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        message: "Invalid blood group",
      });
    }

    // Priority Validation
    const validPriorities = ["Emergency", "Medium", "Low"];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority",
      });
    }

    // Units Validation
    const units = Number(unitsNeeded);

    if (!Number.isInteger(units) || units < 1) {
      return res.status(400).json({
        message: "Units needed must be a positive whole number",
      });
    }

    // Required By Validation
    const requiredDate = new Date(requiredBy);

    if (isNaN(requiredDate.getTime())) {
      return res.status(400).json({
        message: "Invalid required date",
      });
    }

    if (requiredDate <= new Date()) {
      return res.status(400).json({
        message: "Required date must be in the future",
      });
    }

    // Save Request
    const request = await Request.create({
      patientName,
      bloodGroup,
      unitsNeeded,
      hospitalName,
      contactNumber,
      location,
      priority,
      requiredBy,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Blood request created successfully",
      requestId: request.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    
    
    const userId = req.session.userId; 
    console.log("userId:", req.session);
    
    const requests = await Request.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findByPk(id);

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Active", "Fulfilled", "Cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value. Must be Active, Fulfilled, or Cancelled",
      });
    }

    const request = await Request.findByPk(id);

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    if (request.status === status) {
      return res.status(400).json({
        message: `Request is already ${status}`,
      });
    }

    request.status = status;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Request marked as ${status}`,
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
};