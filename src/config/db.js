const { Sequelize } = require("sequelize");
const config = require("./config");

const username = config.dbUsername || "root";
const password = config.dbPassword || "0000";
const host = config.dbHost || "localhost";
const port = config.dbPort || 3306;
const database = config.dbUrl || "rldb";

const sequelize = new Sequelize(database, username, password, {
  host: host,
  port: port,
  dialect: "mysql",

  timezone: "+05:30",

  logging: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.log("Database connection failed:", error);
  });

module.exports = sequelize;
