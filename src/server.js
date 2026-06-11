const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const sequelize = require("./config/db");

require("./models/Otp");
require("./models/User"); 
console.log("AUTH ROUTES LOADED"); 

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(helmet());
app.use(
  cors({
   origin: "*",
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server Running 😊" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();                       
    console.log("Database connected successfully");
 
    await sequelize.sync();

    console.log("Tables synced successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await sequelize.close();
  process.exit(0);
});