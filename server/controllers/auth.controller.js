import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { hashPassword, comparePasswords } from '../utils/auth.utils.js';

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};