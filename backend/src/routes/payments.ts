import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-11-20.acacia',
});

// Create payment intent
router.post('/create-intent', authMiddleware, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const user = (req as any).user;

    if (!bookingId) {
      throw new AppError('Booking ID is required', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.userId !== user.userId) {
      throw new AppError('Access denied', 403);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Cannot pay for cancelled booking', 400);
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment && existingPayment.status === 'PAID') {
      throw new AppError('Payment already completed', 400);
    }

    // Create or update payment record
    let payment = existingPayment;
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId,
          userId: user.userId,
          amount: booking.totalPrice,
          currency: 'USD',
          status: 'PENDING',
        },
      });
    }

    // If using real Stripe
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_mock') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(booking.totalPrice) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          bookingId: booking.id,
          userId: user.userId,
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripePaymentId: paymentIntent.id },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } else {
      // Mock payment for development
      res.json({
        mock: true,
        paymentId: payment.id,
        message: 'Mock payment - use /confirm endpoint to complete',
      });
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Confirm payment (for mock payments)
router.post('/confirm', authMiddleware, async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const user = (req as any).user;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.userId !== user.userId && user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    // Update payment and booking
    const updated = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: 'mock',
        },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      return updatedPayment;
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Get payment status
router.get('/:bookingId', authMiddleware, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const user = (req as any).user;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.userId !== user.userId && user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    res.json(payment);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

// Webhook handler for Stripe
router.post('/webhook', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock') {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    // In production, verify webhook signature
    // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    // Handle different event types
    // switch (event.type) {
    //   case 'payment_intent.succeeded':
    //     // Update payment status
    //     break;
    //   case 'payment_intent.payment_failed':
    //     // Handle failed payment
    //     break;
    // }

    res.json({ received: true });
  } catch (error: any) {
    next(error);
  }
});

export default router;
