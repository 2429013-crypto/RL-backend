const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Profile = sequelize.define(
  "Profile",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    bloodGroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    occupation: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    profilePhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    pinCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    medicalConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    currentMedications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    lastDonationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    receiveAlerts: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    volunteerParticipation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "profile",
    freezeTableName: true,
  },
);

// Associations
User.hasOne(Profile, {
  foreignKey: "userId",
});

Profile.belongsTo(User, {
  foreignKey: "userId",
});

module.exports = Profile;
