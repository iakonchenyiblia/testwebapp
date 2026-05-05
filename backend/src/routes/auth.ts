import { Router } from 'express';
import prisma from '../config/database';
import { hashPassword, generateToken, comparePassword } from '../utils/auth';
import { registerSchema, loginSchema } from '../validators';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({ user, token });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
});

// Login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await comparePassword(validatedData.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as any).user;

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json(currentUser);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as any).user;
    const { firstName, lastName, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { firstName, lastName, phone, avatar },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
      },
    });

    res.json(updatedUser);
  } catch (error: any) {
    next(error);
  }
});

export default router;
