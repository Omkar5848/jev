export default function adminMiddleware(req, res, next) {
  // req.user is populated by authMiddleware
  // We check if the user has the 'Admin' role or profession
  const isAdmin = 
    req.user?.role === 'Admin' || 
    req.user?.profession === 'Admin';

  if (!isAdmin) {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  next();
}