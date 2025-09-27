export const vendorMiddleware = async (req, res, next) => {
    try {
      if (!req.user.isVendor) {
        return res.status(403).json({ message: 'vendor access required' });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  