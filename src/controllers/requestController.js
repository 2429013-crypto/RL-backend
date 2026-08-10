const { Op } = require("sequelize");
const Request = require("../models/request");
const sequelize = require("../config/db");
const Profile = require("../models/profile");
const User = require("../models/User");
const RequestAcceptance = require("../models/RequestAcceptance"); //added
const ROLES = require("../constants/roles");
const {
  bloodRequestTemplate,
} = require("../../templates/bloodRequestTemplate");
const { acceptedTemplate } = require("../../templates/acceptedTemplate");
const { fulfilledTemplate } = require("../../templates/fulfilledTemplate");
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

    // Cooldown — prevent rapid-fire request spam
    const recentRequest = await Request.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (recentRequest) {
      const timeSinceLastRequest =
        Date.now() - new Date(recentRequest.createdAt).getTime();
      if (timeSinceLastRequest < 5 * 60 * 1000) {
        const secondsLeft = Math.ceil(
          (5 * 60 * 1000 - timeSinceLastRequest) / 1000,
        );
        return res.status(429).json({
          message: `Please wait ${secondsLeft} seconds before creating another request`,
        });
      }
    }

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
    console.log(
      "[DEBUG] Request created, starting donor search for:",
      bloodGroup,
    );

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const matchingProfiles = await Profile.findAll({
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
          where: { id: { [Op.ne]: userId } },
          attributes: ["id", "email"],
        },
      ],
      attributes: ["userId", "fullName", "bloodGroup"],
    });

    console.log("[DEBUG] profiles found:", matchingProfiles.length);

    matchingProfiles.forEach((p) => {
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
        html,
      ).catch((err) => console.error("[RedLink] Email send error:", err));
    });

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
      include: [
        {
          model: RequestAcceptance,
          as: "acceptances",
          attributes: ["donorId"],
        },
      ],
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
      include: [
        {
          model: RequestAcceptance,
          as: "acceptances",
          attributes: ["donorId"],
        },
      ],
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
    if (request.userId != req.user.id && req.user.role !== ROLES.ADMIN) {
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
    if (request.userId != req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }
    // Only admin can reopen
    if (
      status === "Active" &&
      request.status !== "Active" &&
      req.user.role !== ROLES.ADMIN
    )
      return res
        .status(403)
        .json({ message: "Only admin can reopen a request" });
    if (request.status === status) {
      return res.status(400).json({
        message: `Request is already ${status}`,
      });
    }

    request.status = status;
    await request.save();

    if (status === "Fulfilled") {
      try {
        const requester = await User.findByPk(request.userId, {
          attributes: ["email"],
        });
        const html = fulfilledTemplate({
          patientName: request.patientName,
          hospitalName: request.hospitalName,
          bloodGroup: request.bloodGroup,
          unitsNeeded: request.unitsNeeded,
        });
        await mailHandler(
          requester.email,
          `✅ Request Fulfilled — ${request.patientName}`,
          html,
        );
      } catch (emailErr) {
        console.error("[RedLink] Fulfilled email error:", emailErr);
      }
    }

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
  const t = await sequelize.transaction();
  try {
    const request = await Request.findByPk(req.params.id, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!request) {
      await t.rollback();
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (request.userId == req.user.id) {
      await t.rollback();
      return res
        .status(403)
        .json({ message: "You cannot accept your own request" });
    }

    if (request.status !== "Active" && request.status !== "Accepted") {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "This request is no longer active" });
    }

    const userProfile = await Profile.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ["phoneNumber"] }],
      transaction: t,
    });

    if (!userProfile) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Please complete your profile first" });
    }

    if (!userProfile.bloodGroup) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Please add your blood group to your profile" });
    }

    if (userProfile.bloodGroup !== request.bloodGroup) {
      await t.rollback();
      return res.status(403).json({
        message: `This request needs ${request.bloodGroup}. Your blood group is ${userProfile.bloodGroup}`,
      });
    }

    const alreadyAccepted = await RequestAcceptance.findOne({
      where: { requestId: request.id, donorId: req.user.id },
      transaction: t,
    });

    if (alreadyAccepted) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "You have already accepted this request" });
    }

    if (request.acceptanceCount >= MAX_DONORS) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: `This request already has ${MAX_DONORS} donors` });
    }

    const serialNumber = request.acceptanceCount + 1;

    await RequestAcceptance.create(
      {
        requestId: request.id,
        donorId: req.user.id,
        serialNumber,
      },
      { transaction: t },
    );

    request.acceptanceCount = serialNumber;
    if (request.status === "Active") request.status = "Accepted";
    await request.save({ transaction: t });

    await t.commit();
    try {
      const requester = await User.findByPk(request.userId, {
        attributes: ["email"],
      });
      const requesterProfile = await Profile.findOne({
        where: { userId: request.userId },
        attributes: ["fullName"],
      });
      // 1. Fetch donor's phone from their profile
      const html = acceptedTemplate({
        requesterName: requesterProfile?.fullName || "Requester",
        donorName: userProfile.fullName || "A donor",
        donorBloodGroup: userProfile.bloodGroup,
        donorPhone: userProfile.User?.phoneNumber || null,
        patientName: request.patientName,
        hospitalName: request.hospitalName,
        contactNumber: request.contactNumber,
        serialNumber,
        totalDonors: serialNumber,
        unitsNeeded: request.unitsNeeded,
      });
      await mailHandler(
        requester.email,
        `🩸 Donor #${serialNumber} accepted your request — ${request.patientName}`,
        html,
      );
    } catch (emailErr) {
      console.error("[RedLink] Accepted email error:", emailErr);
    }

    return res.status(200).json({
      success: true,
      message: `You are donor #${serialNumber} for this request.`,
      serialNumber,
    });
  } catch (error) {
    await t.rollback();
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
          attributes: ["id", "phoneNumber"],
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

const cancelAcceptance = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Blood request not found" });

    const acceptance = await RequestAcceptance.findOne({
      where: { requestId: request.id, donorId: req.user.id },
    });

    if (!acceptance) {
      return res
        .status(400)
        .json({ message: "You have not accepted this request" });
    }

    await acceptance.destroy();

    request.acceptanceCount = Math.max(0, request.acceptanceCount - 1);

    if (request.acceptanceCount === 0 && request.status === "Accepted") {
      request.status = "Active";
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Donation acceptance cancelled successfully",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  acceptRequest, // add
  getAcceptedDonors, //  add
  cancelAcceptance,
};
