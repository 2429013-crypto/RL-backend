const protect = (req, res, next) => {
  // console.log("Session:", req.session);
  if (!req.session || !req.session.isLoggedIn || !req.session.user) {
    return res.status(401).json({
      message: "Access denied. Please login first.",
    });
  } 
    req.user = req.session.user; // added                 
    next();
};                                                    
module.exports = protect;               