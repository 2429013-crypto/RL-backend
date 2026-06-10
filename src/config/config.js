const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUrl: process.env.DB_URL,
  // Add more environment variables as needed
};
