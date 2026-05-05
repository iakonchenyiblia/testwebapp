import { Router } from 'express';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

const router = Router();

// Get dashboard analytics (admin only)
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(0);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [
      totalRevenue,
      totalBookings,
      bookingsByStatus,
      popularServices,
      recentBookings,
    ] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      // Total bookings
      prisma.booking.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      // Bookings by status
      prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      // Popular services
      prisma.service.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          reviewCount: true,
          rating: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { reviewCount: 'desc' },
        take: 10,
      }),
      // Recent bookings
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      revenue: totalRevenue._sum.amount || 0,
      totalBookings,
      bookingsByStatus,
      popularServices,
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', role } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN', 'SPECIALIST'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
});

// Get all bookings (admin only)
router.get('/bookings/all', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { name: true, price: true } },
          schedule: { select: { date: true, startTime: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
