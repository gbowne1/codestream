import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @function auth
 * @description Express middleware to verify a JWT and attach user data to the request.
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {function} next Express next middleware function
 */

export const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Token format invalid. Use Bearer scheme.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired.' });
  }
};

/**
 * @function authorizeRole
 * @description Middleware factory to restrict access based on user role.
 * @param {string[]} requiredRoles  Array of roles allowed (e.g., ['admin', 'moderator'])
 */
export const authorizeRole = (requiredRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res
      .status(500)
      .json({ message: 'Authorization setup error: User role not found.' });
  }
  if (!requiredRoles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: 'Access denied. Insufficient permissions.' });
  }
  next();
};
