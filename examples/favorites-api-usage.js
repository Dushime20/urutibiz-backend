// =====================================================
// USER FAVORITES API - FRONTEND INTEGRATION EXAMPLES
// =====================================================

/**
 * Complete examples for integrating the User Favorites API
 * in JavaScript, TypeScript, React, and Vue.js applications
 */

// =====================================================
// 1. BASIC JAVASCRIPT/FETCH EXAMPLES
// =====================================================

const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Favorites API Service Class
 */
class FavoritesService {
  constructor(authToken) {
    this.authToken = authToken;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
  }

  /**
   * Add product to favorites
   */
  async addToFavorites(productId, metadata = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          product_id: productId,
          metadata: metadata
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add to favorites');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove product from favorites
   */
  async removeFromFavorites(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites/${productId}`, {
        method: 'DELETE',
        headers: this.headers
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove from favorites');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(productId, metadata = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites/${productId}/toggle`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ metadata })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to toggle favorite');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Check if product is favorited
   */
  async isFavorited(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites/${productId}/status`, {
        headers: this.headers
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check favorite status');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      throw error;
    }
  }

  /**
   * Get user's favorites
   */
  async getFavorites(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/users/favorites${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        headers: this.headers
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get favorites');
      }
      
      return {
        favorites: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites/count`, {
        headers: this.headers
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get favorites count');
      }
      
      return result.data.count;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      throw error;
    }
  }

  /**
   * Clear all favorites
   */
  async clearFavorites() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites`, {
        method: 'DELETE',
        headers: this.headers
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to clear favorites');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }

  /**
   * Bulk favorite operations
   */
  async bulkFavoriteOperation(productIds, action, metadata = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites/bulk`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          product_ids: productIds,
          action: action, // 'add' or 'remove'
          metadata: metadata
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to perform bulk operation');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error in bulk operation:', error);
      throw error;
    }
  }
}

// =====================================================
// 2. REACT HOOKS EXAMPLES
// =====================================================

/**
 * React Hook for managing favorites
 */
import { useState, useEffect, useCallback } from 'react';

// Custom hook for favorites functionality
function useFavorites(authToken) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const favoritesService = new FavoritesService(authToken);

  // Load user's favorites
  const loadFavorites = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await favoritesService.getFavorites(filters);
      setFavorites(result.favorites);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Load favorites count
  const loadFavoritesCount = useCallback(async () => {
    try {
      const count = await favoritesService.getFavoritesCount();
      setFavoritesCount(count);
      return count;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [authToken]);

  // Add to favorites
  const addToFavorites = useCallback(async (productId, metadata = {}) => {
    setError(null);
    
    try {
      const result = await favoritesService.addToFavorites(productId, metadata);
      
      // Update local state
      await loadFavorites();
      await loadFavoritesCount();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [authToken, loadFavorites, loadFavoritesCount]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (productId) => {
    setError(null);
    
    try {
      const result = await favoritesService.removeFromFavorites(productId);
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.product_id !== productId));
      setFavoritesCount(prev => Math.max(0, prev - 1));
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [authToken]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (productId, metadata = {}) => {
    setError(null);
    
    try {
      const result = await favoritesService.toggleFavorite(productId, metadata);
      
      // Update local state based on action
      if (result.action === 'added') {
        await loadFavorites();
        setFavoritesCount(prev => prev + 1);
      } else {
        setFavorites(prev => prev.filter(fav => fav.product_id !== productId));
        setFavoritesCount(prev => Math.max(0, prev - 1));
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [authToken, loadFavorites]);

  // Check if product is favorited
  const isFavorited = useCallback(async (productId) => {
    try {
      const status = await favoritesService.isFavorited(productId);
      return status.is_favorited;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [authToken]);

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    setError(null);
    
    try {
      const result = await favoritesService.clearFavorites();
      setFavorites([]);
      setFavoritesCount(0);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [authToken]);

  // Load initial data
  useEffect(() => {
    if (authToken) {
      loadFavorites();
      loadFavoritesCount();
    }
  }, [authToken, loadFavorites, loadFavoritesCount]);

  return {
    favorites,
    favoritesCount,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    clearFavorites,
    loadFavorites,
    loadFavoritesCount
  };
}

// =====================================================
// 3. REACT COMPONENTS EXAMPLES
// =====================================================

/**
 * Favorite Button Component
 */
function FavoriteButton({ productId, initialFavorited = false, onToggle, className = '' }) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const authToken = useAuthToken(); // Assume this hook exists

  const handleToggle = async () => {
    if (!authToken) {
      alert('Please login to add favorites');
      return;
    }

    setLoading(true);
    
    try {
      const favoritesService = new FavoritesService(authToken);
      const result = await favoritesService.toggleFavorite(productId);
      
      setIsFavorited(result.action === 'added');
      
      if (onToggle) {
        onToggle(result);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to update favorite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <span className="loading-spinner">⟳</span>
      ) : (
        <span className="heart-icon">
          {isFavorited ? '❤️' : '🤍'}
        </span>
      )}
    </button>
  );
}

/**
 * Favorites List Component
 */
function FavoritesList({ authToken }) {
  const {
    favorites,
    loading,
    error,
    removeFromFavorites,
    loadFavorites
  } = useFavorites(authToken);

  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    page: 1,
    limit: 10
  });

  const handleRemove = async (productId) => {
    if (confirm('Remove this item from favorites?')) {
      try {
        await removeFromFavorites(productId);
        alert('Removed from favorites!');
      } catch (error) {
        alert('Failed to remove from favorites');
      }
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    loadFavorites(newFilters);
  };

  if (loading) return <div className="loading">Loading favorites...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="favorites-list">
      <h2>My Favorites ({favorites.length})</h2>
      
      {/* Search and Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search favorites..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>

      {/* Favorites Grid */}
      <div className="favorites-grid">
        {favorites.length === 0 ? (
          <div className="empty-state">
            <p>No favorites yet</p>
            <p>Start exploring products and add them to your favorites!</p>
          </div>
        ) : (
          favorites.map((favorite) => (
            <div key={favorite.id} className="favorite-card">
              <img 
                src={favorite.product.images?.[0] || '/placeholder.jpg'} 
                alt={favorite.product.name}
                className="product-image"
              />
              <div className="product-info">
                <h3>{favorite.product.name}</h3>
                <p className="price">
                  ${favorite.product.price_per_day}/{favorite.product.currency} per day
                </p>
                <p className="location">{favorite.product.location}</p>
                <div className="actions">
                  <button 
                    onClick={() => window.location.href = `/products/${favorite.product_id}`}
                    className="view-btn"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleRemove(favorite.product_id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Product Card with Favorite Integration
 */
function ProductCard({ product, authToken }) {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.images?.[0] || '/placeholder.jpg'} 
          alt={product.name}
          className="product-image"
        />
        <FavoriteButton
          productId={product.id}
          initialFavorited={product.is_favorited}
          className="favorite-overlay"
        />
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">${product.price_per_day}/day</p>
        <p className="location">{product.location}</p>
        
        {product.is_favorited && (
          <span className="favorited-badge">❤️ Favorited</span>
        )}
      </div>
    </div>
  );
}

// =====================================================
// 4. VUE.JS COMPOSITION API EXAMPLE
// =====================================================

/**
 * Vue.js Composable for Favorites
 */
// composables/useFavorites.js
import { ref, reactive, computed } from 'vue';

export function useFavorites(authToken) {
  const favorites = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  const favoritesService = new FavoritesService(authToken.value);

  const favoritesCount = computed(() => favorites.value.length);

  const loadFavorites = async (filters = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await favoritesService.getFavorites(filters);
      favorites.value = result.favorites;
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const toggleFavorite = async (productId, metadata = {}) => {
    try {
      const result = await favoritesService.toggleFavorite(productId, metadata);
      
      if (result.action === 'added') {
        await loadFavorites();
      } else {
        favorites.value = favorites.value.filter(fav => fav.product_id !== productId);
      }
      
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    favorites,
    favoritesCount,
    loading,
    error,
    loadFavorites,
    toggleFavorite
  };
}

// =====================================================
// 5. USAGE EXAMPLES
// =====================================================

/**
 * Example: Initialize favorites service
 */
async function initializeFavorites() {
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    console.log('User not authenticated');
    return;
  }

  const favoritesService = new FavoritesService(authToken);
  
  try {
    // Get user's favorites
    const { favorites, pagination } = await favoritesService.getFavorites({
      page: 1,
      limit: 10,
      search: 'electronics'
    });
    
    console.log('User favorites:', favorites);
    console.log('Pagination:', pagination);
    
    // Get favorites count
    const count = await favoritesService.getFavoritesCount();
    console.log('Total favorites:', count);
    
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

/**
 * Example: Add product to favorites with error handling
 */
async function addProductToFavorites(productId) {
  const authToken = localStorage.getItem('authToken');
  const favoritesService = new FavoritesService(authToken);
  
  try {
    const result = await favoritesService.addToFavorites(productId, {
      source: 'product_page',
      timestamp: new Date().toISOString()
    });
    
    console.log('Added to favorites:', result);
    
    // Update UI
    const heartButton = document.querySelector(`[data-product-id="${productId}"] .heart-icon`);
    if (heartButton) {
      heartButton.textContent = '❤️';
      heartButton.classList.add('favorited');
    }
    
    // Show success message
    showNotification('Added to favorites!', 'success');
    
  } catch (error) {
    console.error('Failed to add to favorites:', error);
    showNotification('Failed to add to favorites', 'error');
  }
}

/**
 * Example: Remove product from favorites
 */
async function removeProductFromFavorites(productId) {
  const authToken = localStorage.getItem('authToken');
  const favoritesService = new FavoritesService(authToken);
  
  try {
    await favoritesService.removeFromFavorites(productId);
    
    console.log('Removed from favorites');
    
    // Update UI
    const heartButton = document.querySelector(`[data-product-id="${productId}"] .heart-icon`);
    if (heartButton) {
      heartButton.textContent = '🤍';
      heartButton.classList.remove('favorited');
    }
    
    // Show success message
    showNotification('Removed from favorites!', 'success');
    
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
    showNotification('Failed to remove from favorites', 'error');
  }
}

/**
 * Example: Bulk operations
 */
async function addMultipleToFavorites(productIds) {
  const authToken = localStorage.getItem('authToken');
  const favoritesService = new FavoritesService(authToken);
  
  try {
    const result = await favoritesService.bulkFavoriteOperation(
      productIds, 
      'add',
      { source: 'bulk_import' }
    );
    
    console.log(`Added ${result.added} products to favorites`);
    
    if (result.errors.length > 0) {
      console.warn('Some products failed to add:', result.errors);
    }
    
  } catch (error) {
    console.error('Bulk operation failed:', error);
  }
}

/**
 * Utility function for notifications
 */
function showNotification(message, type = 'info') {
  // Simple notification implementation
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FavoritesService,
    useFavorites,
    FavoriteButton,
    FavoritesList,
    ProductCard
  };
}
