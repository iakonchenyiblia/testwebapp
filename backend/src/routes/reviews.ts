import { Router } from 'express';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { reviewCreateSchema } from '../validators';
import { AppError } from '../utils/errorHandler';

const router = Router();

// Get reviews for a service
router.get('/service/:serviceId', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { serviceId },
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.review.count({ where: { serviceId } }),
    ]);

    res.json({
      reviews,
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

// Create review
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const validatedData = reviewCreateSchema.parse(req.body);
    const user = (req as any).user;

    // Check if user has a completed booking for this service
    const hasBooking = await prisma.booking.findFirst({
      where: {
        userId: user.userId,
        serviceId: validatedData.serviceId,
        status: 'COMPLETED',
      },
    });

    if (!hasBooking && user.role !== 'ADMIN') {
      throw new AppError('You can only review services you have used', 403);
    }

    // Check if user already reviewed this service
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.userId,
        serviceId: validatedData.serviceId,
      },
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this service', 400);
    }

    // Create review and update service rating
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId: user.userId,
          serviceId: validatedData.serviceId,
          rating: validatedData.rating,
          comment: validatedData.comment,
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      });

      // Update service rating
      const stats = await tx.review.aggregate({
        where: { serviceId: validatedData.serviceId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.service.update({
        where: { id: validatedData.serviceId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
      });

      return review;
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
});

// Update review
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = (req as any).user;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.userId !== user.userId && user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    const updatedReview = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: { rating, comment },
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      });

      // Recalculate service rating
      const stats = await tx.review.aggregate({
        where: { serviceId: review.serviceId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.service.update({
        where: { id: review.serviceId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
      });

      return updated;
    });

    res.json(updatedReview);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Delete review
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.userId !== user.userId && user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });

      // Recalculate service rating
      const stats = await tx.review.aggregate({
        where: { serviceId: review.serviceId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.service.update({
        where: { id: review.serviceId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
      });
    });

    res.status(204).send();
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

export default router;
