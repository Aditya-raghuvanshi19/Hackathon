export const adminMiddleware = async (req, res, next) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  