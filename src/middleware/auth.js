import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired.' });
  }
};

export const authorizeRole = (requiredRoles) => (req, res, next) => {
  if (!req.user || !requiredRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  next();
};
