import { Router } from 'express';
import prisma from '../config/database';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/auth';
import { serviceCreateSchema } from '../validators';
import { AppError } from '../utils/errorHandler';

const router = Router();

// Get all services with filters and pagination
router.get('/', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      search,
      sort = 'popular',
      page = '1',
      limit = '12',
      city,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    if (category) {
      where.categoryId = category as string;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating as string) };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
      default:
        orderBy = { reviewCount: 'desc' };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          specialist: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      services,
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

// Get service by slug
router.get('/:slug', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        category: true,
        specialist: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviews: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        schedules: {
          where: {
            date: { gte: new Date() },
            isBooked: false,
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
          take: 50,
        },
      },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    res.json(service);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Create service (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const validatedData = serviceCreateSchema.parse(req.body);

    const service = await prisma.service.create({
      data: validatedData,
      include: { category: true },
    });

    res.status(201).json(service);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
});

// Update service (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, categoryId, imageUrl, isActive } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: { name, description, price, duration, categoryId, imageUrl, isActive },
      include: { category: true },
    });

    res.json(service);
  } catch (error: any) {
    next(error);
  }
});

// Delete service (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
});

export default router;
