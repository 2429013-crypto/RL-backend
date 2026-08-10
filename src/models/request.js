const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Request = sequelize.define(
  "Request",
  {
    patientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    bloodGroup: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    unitsNeeded: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    hospitalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    contactNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    priority: {
      type: DataTypes.ENUM("Emergency", "Medium", "Low"),
      allowNull: false,
    },

    requiredBy: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("Active", "Fulfilled", "Cancelled","Accepted"), //added accepted 
      defaultValue: "Active",
    }, 

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }, 
         acceptanceCount: {
       type: DataTypes.INTEGER,
      defaultValue: 0, // 👈 added
    },
       },
  {
    timestamps: true,
  },
);

module.exports = Request;
