const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUrl: process.env.DB_URL,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  sessionSecret: process.env.SESSION_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  // Add more environment variables as needed
};
