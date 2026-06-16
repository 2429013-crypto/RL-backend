const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {                              
        // Registration fields
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,                       
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phoneNumber: {                                                                       
      type: DataTypes.STRING,               
      allowNull: false, 
    }, 
        state: {
      type: DataTypes.STRING,
      allowNull: false,
    },


    districtName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    pinCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },                            

  profileCompleted: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
  },
   
  // },
  {
    timestamps: true,
  },
);

module.exports = User;