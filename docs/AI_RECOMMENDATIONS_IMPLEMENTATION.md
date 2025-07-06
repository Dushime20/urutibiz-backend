# AI Recommendations & Behavior Tracking Implementation

## Overview

This implementation provides a comprehensive AI-powered recommendation system and user behavior tracking for the UrutiBiz platform. The system includes:

- **AI Recommendations**: Generate personalized product recommendations using multiple algorithms
- **User Behavior Tracking**: Track user interactions across the platform
- **AI Model Metrics**: Monitor and analyze AI model performance
- **Analytics**: Comprehensive analytics and reporting capabilities

## Architecture

### Components

1. **Types** (`src/types/aiRecommendation.types.ts`)
   - Comprehensive TypeScript types for all AI components
   - Enums for recommendation types, interaction types, device types
   - Request/response interfaces
   - Error classes

2. **Repositories** (Data Layer)
   - `AIRecommendationRepository.ts`: CRUD operations for recommendations
   - `UserInteractionRepository.ts`: User behavior tracking operations
   - `AIModelMetricRepository.ts`: AI model performance metrics operations

3. **Services** (Business Logic Layer)
   - `AIRecommendationService.ts`: Core business logic for recommendations and analytics

4. **Controllers** (API Layer)
   - `aiRecommendation.controller.ts`: HTTP request handlers for all AI endpoints

5. **Routes** (Routing Layer)
   - `aiRecommendation.routes.ts`: API route definitions

## Database Schema

### AI Recommendations Table (`ai_recommendations`)

```sql
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Recommendation details
    recommendation_type recommendation_type NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL, -- 0-1
    ranking_position INTEGER,
    
    -- Context and reasoning
    context JSONB, -- Search query, user behavior, etc.
    reasoning TEXT, -- Explainable AI reasoning
    
    -- Interaction tracking
    was_clicked BOOLEAN DEFAULT FALSE,
    was_booked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

### User Interactions Table (`user_interactions`)

```sql
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    
    -- Interaction details
    action_type VARCHAR(50) NOT NULL, -- 'view', 'search', 'click', 'book', 'favorite'
    target_type VARCHAR(50), -- 'product', 'category', 'user'
    target_id UUID,
    
    -- Context
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    device_type VARCHAR(20),
    
    -- Additional data
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### AI Model Metrics Table (`ai_model_metrics`)

```sql
CREATE TABLE ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    data_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Recommendation Endpoints

#### Generate Recommendations
- **POST** `/api/ai/recommendations/generate`
- Generate personalized recommendations for a user

```json
{
  "userId": "user-id",
  "limit": 10,
  "excludeProductIds": ["product-1", "product-2"],
  "recommendationTypes": ["collaborative_filtering", "content_based"]
}
```

#### Get User Recommendations
- **GET** `/api/ai/recommendations/user/:userId`
- Get active recommendations for a specific user

Query parameters: `limit`, `excludeProductIds`, `types`

#### Record Interaction
- **POST** `/api/ai/recommendations/:id/interact`
- Record user interaction with a recommendation

```json
{
  "actionType": "click", // or "book"
  "context": {
    "source": "homepage",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### User Interaction Endpoints

#### Track Interaction
- **POST** `/api/ai/interactions`
- Track a user interaction

```json
{
  "userId": "user-id",
  "sessionId": "session-id",
  "actionType": "view",
  "targetType": "product",
  "targetId": "product-id",
  "pageUrl": "/products/product-id",
  "userAgent": "Mozilla/5.0...",
  "deviceType": "mobile",
  "metadata": {
    "searchQuery": "beach vacation",
    "category": "travel"
  }
}
```

### Analytics Endpoints

#### User Behavior Analytics
- **GET** `/api/ai/analytics/behavior`
- Get user behavior analytics

Query parameters: `userId`, `from`, `to`

#### Recommendation Analytics
- **GET** `/api/ai/analytics/recommendations`
- Get recommendation performance analytics

#### Model Metrics
- **GET** `/api/ai/analytics/models`
- Get AI model performance metrics

## Recommendation Algorithms

The system implements multiple recommendation algorithms:

### 1. Collaborative Filtering
- Analyzes user behavior patterns to find similar users
- Recommends products liked by similar users
- Uses user interaction history for similarity calculations

### 2. Content-Based Filtering
- Recommends products similar to those the user has interacted with
- Analyzes product features and user preferences
- Uses content similarity algorithms

### 3. Behavior-Based Recommendations
- Analyzes user browsing patterns and behaviors
- Considers time spent, interaction frequency, and patterns
- Adapts to user behavior changes

### 4. Trending Recommendations
- Identifies trending products based on recent activity
- Considers popularity and engagement metrics
- Time-weighted popularity calculations

### 5. Hybrid Approach
- Combines multiple algorithms for better results
- Weighted scoring based on algorithm confidence
- Fallback mechanisms for cold start problems

## User Behavior Tracking

### Tracked Events

- **View**: User views a product, category, or page
- **Search**: User performs a search query
- **Click**: User clicks on a recommendation or link
- **Book**: User makes a booking
- **Favorite**: User adds to favorites
- **Share**: User shares content
- **Rate**: User rates a product
- **Review**: User writes a review
- **Compare**: User compares products
- **Filter**: User applies filters

### Device Detection

Automatic device type detection from user agent:
- **Desktop**: Windows, Mac, Linux browsers
- **Mobile**: Mobile browsers, iOS, Android
- **Tablet**: iPad, Android tablets
- **Unknown**: Unrecognized devices

## Analytics Features

### Recommendation Analytics

- **Click-through Rate (CTR)**: Percentage of recommendations clicked
- **Conversion Rate**: Percentage of recommendations that led to bookings
- **Confidence Score Analysis**: Distribution of recommendation confidence
- **Algorithm Performance**: Comparison of different recommendation types
- **Temporal Analysis**: Performance trends over time

### User Behavior Analytics

- **Total Interactions**: Overall interaction volume
- **Unique Users/Sessions**: User engagement metrics
- **Action Distribution**: Breakdown by interaction type
- **Device Analytics**: Usage patterns by device type
- **Hourly Activity**: Time-based usage patterns
- **User Journey**: Session-based interaction flows

### Model Performance Metrics

- **Accuracy**: Model prediction accuracy
- **Precision/Recall**: Recommendation quality metrics
- **Response Time**: Model inference performance
- **Coverage**: Catalog coverage by recommendations
- **Diversity**: Recommendation diversity metrics

## Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/urutibiz
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=urutibiz
DATABASE_USER=username
DATABASE_PASSWORD=password

# AI Configuration
AI_RECOMMENDATION_LIMIT=50
AI_ANALYTICS_RETENTION_DAYS=365
AI_CLEANUP_INTERVAL_HOURS=24
```

### Service Configuration

```typescript
// AI Service configuration
const aiConfig = {
  defaultRecommendationLimit: 10,
  maxRecommendationAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  confidenceThreshold: 0.3,
  enabledAlgorithms: [
    'collaborative_filtering',
    'content_based',
    'behavior_based',
    'trending'
  ]
};
```

## Error Handling

### Custom Error Classes

- `AIRecommendationError`: Recommendation-related errors
- `UserInteractionError`: User interaction tracking errors
- `AIModelMetricError`: Model metrics errors

### Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `GENERATION_ERROR`: Recommendation generation failed
- `TRACKING_ERROR`: Interaction tracking failed
- `EXPIRED`: Recommendation has expired
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Security Considerations

### Data Privacy

- User interaction data is anonymized when possible
- Sensitive data is encrypted in transit and at rest
- GDPR compliance for user data handling
- Configurable data retention policies

### Access Control

- API endpoints require proper authentication
- User-specific data access controls
- Admin-only analytics endpoints
- Rate limiting on API endpoints

## Performance Optimization

### Database Optimization

- Proper indexing on frequently queried columns
- Partitioning for large interaction tables
- Regular cleanup of expired data
- Connection pooling for database access

### Caching Strategy

- Cache frequently accessed recommendations
- Redis-based session caching
- Analytics result caching
- Model prediction caching

### Monitoring

- API response time monitoring
- Database query performance tracking
- Model inference time metrics
- Error rate monitoring

## Integration Guide

### Frontend Integration

```javascript
// Track user interaction
const trackInteraction = async (actionType, targetType, targetId) => {
  await fetch('/api/ai/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType,
      targetType,
      targetId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    })
  });
};

// Get recommendations
const getRecommendations = async (userId, limit = 10) => {
  const response = await fetch(`/api/ai/recommendations/user/${userId}?limit=${limit}`);
  return response.json();
};

// Record recommendation click
const recordRecommendationClick = async (recommendationId) => {
  await fetch(`/api/ai/recommendations/${recommendationId}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType: 'click' })
  });
};
```

### Backend Integration

```typescript
// In your booking service
import { AIRecommendationService } from './services/AIRecommendationService';

class BookingService {
  constructor(private aiService: AIRecommendationService) {}

  async createBooking(bookingData: any) {
    const booking = await this.bookingRepository.create(bookingData);
    
    // Track booking interaction
    await this.aiService.trackUserInteraction(
      booking.userId,
      booking.sessionId,
      InteractionActionType.BOOK,
      TargetType.PRODUCT,
      booking.productId
    );
    
    return booking;
  }
}
```

## Testing

### Unit Tests

- Repository layer tests with mock database
- Service layer tests with dependency injection
- Controller tests with mock services
- Type validation tests

### Integration Tests

- End-to-end API testing
- Database integration tests
- Analytics calculation tests
- Recommendation algorithm tests

### Performance Tests

- Load testing for recommendation generation
- Stress testing for interaction tracking
- Database performance under load
- Memory usage monitoring

## Deployment

### Database Migration

```bash
# Run migrations to create AI tables
npm run db:migrate
```

### Environment Setup

```bash
# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="postgresql://..."
export NODE_ENV="production"

# Start the service
npm start
```

### Monitoring Setup

- Set up application monitoring (e.g., New Relic, DataDog)
- Configure log aggregation (e.g., ELK stack)
- Set up alerting for error rates and response times
- Monitor database performance metrics

## Future Enhancements

### Advanced Features

- **Real-time Recommendations**: WebSocket-based live recommendations
- **A/B Testing**: Framework for testing recommendation algorithms
- **Deep Learning**: Integration with TensorFlow/PyTorch models
- **Contextual Recommendations**: Location and time-based recommendations
- **Social Recommendations**: Social graph-based recommendations

### Scalability Improvements

- **Microservices**: Split into dedicated AI microservices
- **Event Streaming**: Kafka-based event processing
- **Distributed Computing**: Spark-based batch processing
- **Multi-region Deployment**: Global recommendation distribution
- **Auto-scaling**: Kubernetes-based auto-scaling

### Analytics Enhancements

- **Real-time Dashboards**: Live analytics dashboards
- **Machine Learning Insights**: Automated insight generation
- **Custom Metrics**: User-defined performance metrics
- **Predictive Analytics**: Future trend predictions
- **Anomaly Detection**: Automated anomaly detection

This implementation provides a solid foundation for AI-powered recommendations and user behavior tracking, with room for future enhancements and scalability improvements.
