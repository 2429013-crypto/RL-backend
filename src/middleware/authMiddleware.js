const protect = (req, res, next) => {
  // if (!req.session || !req.session.isLoggedIn || !req.session.userId) {
  //   return res.status(401).json({
  //     message: "Access denied. Please login first.",
  //   });
  // }
  next();
};

module.exports = protect;