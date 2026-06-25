const { Op } = require("sequelize");
const Request = require("../models/request"); 
const User = require("../models/User");
const Profile = require("../models/profile");
const RequestAcceptance = require("../models/RequestAcceptance"); //added 
const ROLES = require("../constants/roles"); 
const { bloodRequestTemplate } = require("../../templates/bloodRequestTemplate");
const mailHandler = require("../../helper/mailHandler");


const APP_URL = process.env.APP_URL || "http://localhost:5173";
const MAX_DONORS = 10;                                                                                                             
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

    // const userId = req.session.userId;
    const userId = req.user.id;                               

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
    console.log("[DEBUG] Request created, starting donor search for:", bloodGroup); // ADD 

    // 🩸 Notify matching donors
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    Profile.findAll({
      where: {
        bloodGroup,
        receiveAlerts: true,
        [Op.or]: [
          { lastDonationDate: null },
          { lastDonationDate: { [Op.lt]: threeMonthsAgo } },
        ],
      },
      include: [
        {
          model: User,
          where: {
            id: { [Op.ne]: userId },
          },
          attributes: ["id", "email"],
        },
      ],
      attributes: ["userId", "fullName", "bloodGroup"],
    })
      .then((profiles) => {
          console.log("[DEBUG] profiles found:", profiles.length); // add 
  console.log("[DEBUG] bloodGroup searched:", bloodGroup); // add
  
  if (profiles.length === 0) {
    console.log("[RedLink] No matching donors found");
    return;
  }
  console.log(`[RedLink] Sending email to ${profiles.length} donor(s)`);
  profiles.forEach((p) => {
    const html = bloodRequestTemplate({
      donorName: p.fullName || "Donor",
      bloodGroup,
      patientName,
      hospitalName,
      location,
      unitsNeeded,
      requiredBy,
      priority,
      contactNumber,
      requestId: request.id,
      appUrl: APP_URL,
    });
    mailHandler(
      p.User.email,
      `🩸 Urgent ${bloodGroup} Blood Needed — ${hospitalName}`,
      html
    );
  });
})
.catch((err) => console.error("[RedLink] Donor alert email error:", err));
        // Find matching donors for email (your friend uses this)
    const matchingProfiles = await findMatchingDonors(bloodGroup);
  return res.status(201).json({
      success: true,
      message: "Blood request created successfully",
      requestId: request.id,           
      matchingDonorsCount: matchingProfiles.length,
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
    const userId = req.user.id;    

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
  // const { id } = req.params;
  //const request = await Request.findByPk(id);              
      const request = await Request.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }
    //protect part for the get request by id
    if (
      request.userId != req.user.id &&
      req.user.role !== ROLES.ADMIN
    ) {
      return res.status(403).json({
        message: "Not authorized",
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
        message:
          "Invalid status value. Must be Active, Fulfilled, or Cancelled",
      });
    }                      
    const request = await Request.findByPk(id);

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    } 
    //protect updateRequestStatus 
        // Owner or admin only      
   if (
      request.userId != req.user.id &&
      req.user.role !== ROLES.ADMIN
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }          
        // Only admin can reopen 
            if (status === "Active" && request.status !== "Active" && req.user.role !== ROLES.ADMIN)
      return res.status(403).json({ message: "Only admin can reopen a request" });
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
const acceptRequest = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Blood request not found" });

    // Cannot accept own request
    if (request.userId == req.user.id)
      return res.status(403).json({ message: "You cannot accept your own request" });

    // Must be Active
    if (request.status !== "Active")
      return res.status(400).json({ message: "This request is no longer active" });

    // Fetch profile to get blood group
    const Profile = require("../models/profile");
    const userProfile = await Profile.findOne({ where: { userId: req.user.id } });

    if (!userProfile)
      return res.status(400).json({ message: "Please complete your profile first" });

    if (!userProfile.bloodGroup)
      return res.status(400).json({ message: "Please add your blood group to your profile" });

    // Blood group must match
    if (userProfile.bloodGroup !== request.bloodGroup)
      return res.status(403).json({
        message: `This request needs ${request.bloodGroup}. Your blood group is ${userProfile.bloodGroup}`,
      });

    // Already accepted by this user
    const alreadyAccepted = await RequestAcceptance.findOne({
      where: { requestId: request.id, donorId: req.user.id },
    });
    if (alreadyAccepted)
      return res.status(400).json({ message: "You have already accepted this request" });

    // Max donors check
    if (request.acceptanceCount >= MAX_DONORS)
      return res.status(400).json({ message: `This request already has ${MAX_DONORS} donors` });

    const serialNumber = request.acceptanceCount + 1;

    await RequestAcceptance.create({
      requestId: request.id,
      donorId: req.user.id,
      serialNumber,
    }); 
  request.acceptanceCount = serialNumber;
    if (request.status === "Active") request.status = "Accepted";
    await request.save(); 

    return res.status(200).json({
      success: true,
      message: `You are donor #${serialNumber} for this request.`,
      serialNumber,
      data: request,
    }); 
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};  
const getAcceptedDonors = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);

    if (!request)
      return res.status(404).json({ message: "Blood request not found" });

    // Only owner or admin can see donors list
    if (request.userId != req.user.id && req.user.role !== ROLES.ADMIN)
      return res.status(403).json({ message: "Not authorized" });

    const acceptances = await RequestAcceptance.findAll({
      where: { requestId: request.id },
      order: [["serialNumber", "ASC"]],
      include: [
        {
          model: User,
          as: "donor",
        attributes: ["id", "email", "phoneNumber"], 
        },
      ],                    
    });                    

    return res.status(200).json({
      success: true,
      totalDonors: acceptances.length,
      remainingSlots: MAX_DONORS - acceptances.length,
      data: acceptances,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const findMatchingDonors = async (bloodGroup) => {
  const Profile = require("../models/profile");

  const matchingProfiles = await Profile.findAll({
    where: {
      bloodGroup,
      receiveAlerts: true, // only users who opted in to alerts
    },
    include: [
      {
        model: User,
        attributes: ["id", "email"],
      }, 
    ],
  });

  return matchingProfiles;
};
module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  acceptRequest,      // add
  getAcceptedDonors,  //  add
  findMatchingDonors, //  add
}; 