const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Otp = sequelize.define(
  "Otp",
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    }, 

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },                                    
  },
  {
    timestamps: true,
    tableName: "otps",
  },
);

module.exports = Otp;
