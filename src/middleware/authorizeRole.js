// const ROLES = require("../constants/roles");
// const authorizeRole = (...roles) => {
//   return (req, res, next) => {
//     if (!req.session.user) {
//       return res.status(401).json({
//         message: "Please login first",
//       });
//     }
//    if (!roles.includes(req.session.user.role)) {
//       return res.status(403).json({
//         message: "Access denied",
//       });
//     }
//    next();                                                             
//   };
// };
// module.exports = authorizeRole;                                       
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // req.user is already set by protect middleware
    // so no need to check req.session.user again
    if (!req.user) {
      return res.status(401).json({ message: "Please login first" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = authorizeRole;            