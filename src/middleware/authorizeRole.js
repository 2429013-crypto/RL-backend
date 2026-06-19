const ROLES = require("../constants/roles");

const authorizeRole = (...roles) => {

  return (req, res, next) => {

    if (!req.session.user) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();

  };

};

module.exports = authorizeRole; 
