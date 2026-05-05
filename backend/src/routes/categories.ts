import { Router } from 'express';
import prisma from '../config/database';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

const router = Router();

// Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        _count: {
          select: { services: true },
        },
      },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Get category by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          include: {
            category: true,
            specialist: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        children: true,
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json(category);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Create category (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { name, slug, description, icon, parentId } = req.body;

    const category = await prisma.category.create({
      data: { name, slug, description, icon, parentId },
    });

    res.status(201).json(category);
  } catch (error: any) {
    next(error);
  }
});

// Update category (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, parentId } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, description, icon, parentId },
    });

    res.json(category);
  } catch (error: any) {
    next(error);
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
});

export default router;
