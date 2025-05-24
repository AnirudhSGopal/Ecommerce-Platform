import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Set req.user as an object
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default authUser;
