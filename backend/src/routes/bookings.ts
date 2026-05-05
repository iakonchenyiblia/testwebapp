import { Router } from 'express';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { bookingCreateSchema } from '../validators';
import { AppError } from '../utils/errorHandler';
import { bookingLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get user bookings
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as any).user;
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: user.userId };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: {
            select: { id: true, name: true, imageUrl: true },
          },
          schedule: {
            select: { date: true, startTime: true, endTime: true },
          },
          payment: {
            select: { id: true, status: true, amount: true },
          },
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

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            category: true,
            specialist: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        schedule: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Check if user owns this booking or is admin
    if (booking.userId !== user.userId && user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    res.json(booking);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Create booking
router.post('/', authMiddleware, bookingLimiter, async (req, res, next) => {
  try {
    const validatedData = bookingCreateSchema.parse(req.body);
    const user = (req as any).user;

    // Use Prisma transaction to prevent double booking
    const result = await prisma.$transaction(async (tx) => {
      // Check if schedule is still available
      const schedule = await tx.schedule.findUnique({
        where: { id: validatedData.scheduleId },
        include: { service: true },
      });

      if (!schedule) {
        throw new AppError('Schedule not found', 404);
      }

      if (schedule.isBooked) {
        throw new AppError('This time slot is already booked', 400);
      }

      // Mark schedule as booked
      await tx.schedule.update({
        where: { id: validatedData.scheduleId },
        data: { isBooked: true, bookedAt: new Date() },
      });

      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId: user.userId,
          serviceId: validatedData.serviceId,
          scheduleId: validatedData.scheduleId,
          totalPrice: schedule.service.price,
          notes: validatedData.notes,
          status: 'PENDING',
        },
        include: {
          service: {
            select: { id: true, name: true, price: true },
          },
          schedule: {
            select: { date: true, startTime: true, endTime: true },
          },
        },
      });

      return booking;
    });

    // Emit WebSocket event for real-time updates (if connected)
    // This would be handled by the WebSocket server

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
});

// Cancel booking
router.put('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { schedule: true, payment: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.userId !== user.userId && user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new AppError('Cannot cancel this booking', 400);
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: user.userId,
        },
        include: {
          service: true,
          schedule: true,
        },
      });

      // Free up the schedule slot
      if (updated.scheduleId) {
        await tx.schedule.update({
          where: { id: updated.scheduleId },
          data: { isBooked: false, bookingId: null },
        });
      }

      return updated;
    });

    res.json(updatedBooking);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Confirm booking (admin/specialist only)
router.put('/:id/confirm', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (user.role !== 'ADMIN' && user.role !== 'SPECIALIST') {
      throw new AppError('Access denied', 403);
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        service: true,
        schedule: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json(booking);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

export default router;
