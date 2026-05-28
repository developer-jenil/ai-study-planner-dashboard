const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from Authorization header
  const authHeader = req.header('Authorization');
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Fallback for header without Bearer prefix or x-auth-token
    token = req.header('x-auth-token') || authHeader;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded user info (which will contain user ID in 'id' field) to request object
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
