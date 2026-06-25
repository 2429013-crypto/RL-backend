const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RequestAcceptance = sequelize.define(
  "RequestAcceptance",
  {
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    donorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    acceptedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    serialNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = RequestAcceptance; 