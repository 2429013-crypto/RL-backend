require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/db");

require("./models/otp");        
require("./models/user");
require("./models/profile");
require("./models/request");
require("./models/RequestAcceptance");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const requestRoutes = require("./routes/requestRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "Sessions",
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 15 * 60 * 1000,
});

app.use(
  session({
    name: "redlink_session",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/requests", requestRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server Running 😊" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    const User = require("./models/user");
    const Request = require("./models/request");
    const RequestAcceptance = require("./models/RequestAcceptance");

    Request.hasMany(RequestAcceptance, { foreignKey: "requestId", as: "acceptances" });
    RequestAcceptance.belongsTo(Request, { foreignKey: "requestId" });
    User.hasMany(RequestAcceptance, { foreignKey: "donorId", as: "acceptances" });
    RequestAcceptance.belongsTo(User, { foreignKey: "donorId", as: "donor" });

  //  await sequelize.sync({ alter: true });  
   await sequelize.sync(); 
    console.log("Tables synced successfully");

    await sessionStore.sync();
    console.log("Session store synced");                  

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
