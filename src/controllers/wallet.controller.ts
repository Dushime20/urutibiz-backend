import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import { getDatabase } from '@/config/database';
import { ResponseHelper } from '@/utils/response';

export class WalletController {
  /**
   * Get owner's wallet/earnings from their items being booked
   * GET /api/v1/wallet/earnings/:ownerId
   */
  public getOwnerEarnings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { ownerId } = req.params;
      const authenticatedUserId = req.user?.id;

      // Check authorization - user can only view their own earnings, or admin can view anyone's
      if (authenticatedUserId !== ownerId && req.user?.role !== 'admin') {
        ResponseHelper.error(res, 'Access denied. You can only view your own earnings.', undefined, 403);
        return;
      }

      const db = getDatabase();

      // Get all bookings where this user is the owner
      const bookings = await db('bookings')
        .select(
          'bookings.id',
          'bookings.status',
          'bookings.total_amount',
          'bookings.created_at',
          'bookings.start_date',
          'bookings.end_date',
          'products.title as product_title',
          'products.id as product_id',
          'users.first_name as renter_name',
          'users.email as renter_email',
          'product_prices.currency'
        )
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users', 'bookings.renter_id', 'users.id')
        .leftJoin('product_prices', function() {
          this.on('product_prices.product_id', '=', 'products.id')
              .andOn('product_prices.country_id', '=', 'products.country_id')
              .andOn('product_prices.is_active', '=', db.raw('true'));
        })
        .where('bookings.owner_id', ownerId)
        .orderBy('bookings.created_at', 'desc');

      // Calculate earnings summary by currency
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

      // Group earnings by currency
      const earningsByCurrency: Record<string, { total: number; pending: number; cancelled: number }> = {};
      
      completedBookings.forEach(booking => {
        const currency = booking.currency || 'RWF';
        if (!earningsByCurrency[currency]) {
          earningsByCurrency[currency] = { total: 0, pending: 0, cancelled: 0 };
        }
        earningsByCurrency[currency].total += parseFloat(booking.total_amount || 0);
      });
      
      pendingBookings.forEach(booking => {
        const currency = booking.currency || 'RWF';
        if (!earningsByCurrency[currency]) {
          earningsByCurrency[currency] = { total: 0, pending: 0, cancelled: 0 };
        }
        earningsByCurrency[currency].pending += parseFloat(booking.total_amount || 0);
      });
      
      cancelledBookings.forEach(booking => {
        const currency = booking.currency || 'RWF';
        if (!earningsByCurrency[currency]) {
          earningsByCurrency[currency] = { total: 0, pending: 0, cancelled: 0 };
        }
        earningsByCurrency[currency].cancelled += parseFloat(booking.total_amount || 0);
      });

      // Calculate totals (sum across all currencies)
      const totalEarnings = Object.values(earningsByCurrency).reduce((sum, curr) => sum + curr.total, 0);
      const pendingEarnings = Object.values(earningsByCurrency).reduce((sum, curr) => sum + curr.pending, 0);
      const cancelledAmount = Object.values(earningsByCurrency).reduce((sum, curr) => sum + curr.cancelled, 0);

      // Get recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentBookings = bookings.filter(b => new Date(b.created_at) >= thirtyDaysAgo);

      const walletData = {
        owner_id: ownerId,
        summary: {
          total_earnings: totalEarnings,
          pending_earnings: pendingEarnings,
          cancelled_amount: cancelledAmount,
          total_bookings: bookings.length,
          completed_bookings: completedBookings.length,
          pending_bookings: pendingBookings.length,
          cancelled_bookings: cancelledBookings.length,
          earnings_by_currency: earningsByCurrency
        },
        recent_activity: recentBookings.map(booking => ({
          booking_id: booking.id,
          product_title: booking.product_title,
          product_id: booking.product_id,
          renter_name: booking.renter_name,
          renter_email: booking.renter_email,
          amount: parseFloat(booking.total_amount || 0),
          status: booking.status,
          booking_date: booking.created_at,
          rental_period: {
            start_date: booking.start_date,
            end_date: booking.end_date
          }
        })),
        all_bookings: bookings.map(booking => ({
          booking_id: booking.id,
          product_title: booking.product_title,
          product_id: booking.product_id,
          renter_name: booking.renter_name,
          renter_email: booking.renter_email,
          amount: parseFloat(booking.total_amount || 0),
          status: booking.status,
          booking_date: booking.created_at,
          rental_period: {
            start_date: booking.start_date,
            end_date: booking.end_date
          }
        }))
      };

      ResponseHelper.success(res, 'Owner earnings retrieved successfully', walletData);

    } catch (error) {
      console.error('Error fetching owner earnings:', error);
      ResponseHelper.error(res, 'Failed to fetch owner earnings', 500);
    }
  };

  /**
   * Get owner's wallet balance (simplified version)
   * GET /api/v1/wallet/balance/:ownerId
   */
  public getWalletBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { ownerId } = req.params;
      const authenticatedUserId = req.user?.id;

      // Check authorization
      if (authenticatedUserId !== ownerId && req.user?.role !== 'admin') {
        ResponseHelper.error(res, 'Access denied', undefined, 403);
        return;
      }

      const db = getDatabase();

      // Debug: Get ALL bookings for this owner first
      const allBookings = await db('bookings')
        .select('id', 'status', 'total_amount', 'created_at')
        .where('owner_id', ownerId);

      console.log(`[WalletController] Found ${allBookings.length} bookings for owner ${ownerId}`);
      allBookings.forEach((b, i) => {
        console.log(`[WalletController] Booking ${i+1}: ID=${b.id}, Status=${b.status}, Amount=${b.total_amount}`);
      });

      // Get completed payment transactions for this user
      // Include two types:
      // 1. Transactions where user is the owner of the booking (receiving rental payments)
      // 2. Transactions where user is directly the user_id (receiving refunds, etc.)
      
      // Type 1: Payments received as product owner
      const ownerPayments = await db('payment_transactions')
        .join('bookings', 'payment_transactions.booking_id', 'bookings.id')
        .select(
          'payment_transactions.amount',
          'payment_transactions.currency',
          'payment_transactions.transaction_type',
          'payment_transactions.status',
          db.raw("'owner_payment' as source")
        )
        .where('bookings.owner_id', ownerId)
        .where('payment_transactions.status', 'completed')
        .whereIn('payment_transactions.transaction_type', ['booking_payment', 'payment']); // Only actual payments

      // Type 2: Transactions received directly (refunds, etc.)
      const directTransactions = await db('payment_transactions')
        .select(
          'payment_transactions.amount',
          'payment_transactions.currency',
          'payment_transactions.transaction_type',
          'payment_transactions.status',
          db.raw("'direct_transaction' as source")
        )
        .where('payment_transactions.user_id', ownerId)
        .where('payment_transactions.status', 'completed')
        .whereIn('payment_transactions.transaction_type', ['refund', 'partial_refund']); // Refunds received

      // Combine both types
      const completedPayments = [...ownerPayments, ...directTransactions];

      console.log(`[WalletController] Found ${ownerPayments.length} owner payments and ${directTransactions.length} direct transactions`);

      // Group balances by currency
      const balancesByCurrency: Record<string, number> = {};
      completedPayments.forEach(payment => {
        const currency = payment.currency || 'RWF';
        const amount = parseFloat(payment.amount || 0);
        balancesByCurrency[currency] = (balancesByCurrency[currency] || 0) + amount;
      });

      // Calculate total balance (sum of all currencies)
      const totalBalance = Object.values(balancesByCurrency).reduce((sum, amount) => sum + amount, 0);
      
      // Get primary currency from completed payments
      const primaryCurrencyPayment = await db('payment_transactions')
        .select('payment_transactions.currency')
        .where(function() {
          this.where('payment_transactions.user_id', ownerId)
            .orWhereIn('payment_transactions.booking_id', function() {
              this.select('id').from('bookings').where('owner_id', ownerId);
            });
        })
        .where('payment_transactions.status', 'completed')
        .limit(1);
      
      const primaryCurrency = primaryCurrencyPayment.length > 0 
        ? primaryCurrencyPayment[0].currency || 'RWF'
        : 'RWF';
      
      const balanceData = {
        owner_id: ownerId,
        balance: totalBalance,
        currency: primaryCurrency,
        balances_by_currency: balancesByCurrency,
        last_updated: new Date().toISOString(),
        debug: {
          total_bookings: allBookings.length,
          owner_payments: ownerPayments.length,
          direct_transactions: directTransactions.length,
          completed_payments: completedPayments.length,
          all_booking_statuses: allBookings.map(b => ({ id: b.id, status: b.status, amount: b.total_amount })),
          currency_breakdown: balancesByCurrency,
          payment_breakdown: completedPayments.map(p => ({ 
            amount: p.amount, 
            currency: p.currency, 
            type: p.transaction_type,
            status: p.status,
            source: p.source
          }))
        }
      };

      ResponseHelper.success(res, 'Wallet balance retrieved successfully', balanceData);

    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      ResponseHelper.error(res, 'Failed to fetch wallet balance', 500);
    }
  };
}
