const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "rldb",
  "root",
  "0000",
  {
    host: "localhost",
    dialect: "mysql",

    timezone: "+05:30",

    logging: false,
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.log("Database connection failed:", error);
  });

module.exports = sequelize;