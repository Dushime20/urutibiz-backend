// =====================================================
// USER TRANSACTIONS API EXAMPLES
// =====================================================

const API_BASE = 'http://localhost:3000/api/v1';

// Example user token (replace with actual user's token)
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const USER_ID = '39f22329-d38e-4e0a-a01c-6ae36d911b30';

// =====================================================
// 1. GET ALL USER TRANSACTIONS
// =====================================================

async function getUserTransactions(userId) {
  try {
    const response = await fetch(`${API_BASE}/payment-transactions/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ User Transactions:', data.data);
      return data.data;
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// =====================================================
// 2. GET USER TRANSACTION SUMMARY
// =====================================================

async function getUserTransactionSummary(userId) {
  try {
    const response = await fetch(`${API_BASE}/payment-transactions/user/${userId}/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Transaction Summary:', {
        totalTransactions: data.data.totalTransactions,
        totalAmount: data.data.totalAmount,
        completedTransactions: data.data.completedTransactions,
        averageAmount: data.data.averageAmount
      });
      return data.data;
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// =====================================================
// 3. GET TRANSACTIONS WITH FILTERS AND PAGINATION
// =====================================================

async function getTransactionsWithFilters(filters = {}) {
  const queryParams = new URLSearchParams({
    userId: USER_ID,
    page: filters.page || 1,
    limit: filters.limit || 10,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
    ...filters
  });

  try {
    const response = await fetch(`${API_BASE}/payment-transactions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Filtered Transactions:', {
        transactions: data.transactions,
        pagination: {
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages
        }
      });
      return data;
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// =====================================================
// 4. GET TRANSACTIONS BY BOOKING ID
// =====================================================

async function getTransactionsByBooking(bookingId) {
  try {
    const response = await fetch(`${API_BASE}/payment-transactions/booking/${bookingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Booking Transactions:', data.data);
      return data.data;
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// =====================================================
// 5. USAGE EXAMPLES
// =====================================================

// Example 1: Get all user transactions
getUserTransactions(USER_ID);

// Example 2: Get user summary
getUserTransactionSummary(USER_ID);

// Example 3: Get recent completed transactions
getTransactionsWithFilters({
  status: 'completed',
  page: 1,
  limit: 5
});

// Example 4: Get transactions by amount range
getTransactionsWithFilters({
  amountMin: 100,
  amountMax: 1000,
  currency: 'USD'
});

// Example 5: Get transactions by date range
getTransactionsWithFilters({
  createdAfter: '2025-01-01',
  createdBefore: '2025-12-31'
});

// Example 6: Get transactions for specific booking
getTransactionsByBooking('ef7baad7-97ad-4578-a2c8-9bb3d21e9df9');

// =====================================================
// REACT/FRONTEND HOOK EXAMPLE
// =====================================================

// Custom React hook for user transactions
function useUserTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const data = await getUserTransactions(userId);
        setTransactions(data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  return { transactions, loading, error };
}

// =====================================================
// CURL EXAMPLES FOR TESTING
// =====================================================

/*
# Get all user transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/v1/payment-transactions/user/USER_ID

# Get user transaction summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/v1/payment-transactions/user/USER_ID/summary

# Get filtered transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/v1/payment-transactions?userId=USER_ID&status=completed&page=1&limit=10"

# Get booking transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/v1/payment-transactions/booking/BOOKING_ID
*/ 