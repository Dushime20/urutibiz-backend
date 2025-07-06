# Reviews Implementation Documentation

## Overview

The Reviews system for UrutiBiz provides a comprehensive review and rating platform that allows users to review items and each other after rental transactions. The system includes advanced features like AI-powered content moderation, analytics, and a robust moderation workflow.

## Architecture

### Database Schema

The `reviews` table contains the following key fields:

- **Core Fields**: `id`, `booking_id`, `reviewer_id`, `reviewed_user_id`
- **Ratings**: `overall_rating` (required), `communication_rating`, `condition_rating`, `value_rating`
- **Content**: `title`, `comment`
- **AI Moderation**: `ai_sentiment_score`, `ai_toxicity_score`, `is_flagged`, `moderation_status`
- **Response**: `response`, `response_date`
- **Metadata**: `created_at`

### Key Features

1. **Multi-dimensional Ratings**: Overall, communication, condition, and value ratings
2. **AI Content Analysis**: Automated sentiment, toxicity, and helpfulness scoring
3. **Moderation Workflow**: Pending → Approved/Rejected/Flagged states
4. **Review Responses**: Reviewed users can respond to reviews
5. **Analytics**: User analytics and system-wide statistics
6. **Search & Filtering**: Advanced search with multiple filter criteria

## API Endpoints

### Core CRUD Operations

```http
POST   /api/reviews              # Create review
GET    /api/reviews/:id          # Get review by ID
PUT    /api/reviews/:id          # Update review
DELETE /api/reviews/:id          # Delete review (24h window)
GET    /api/reviews              # Search reviews with filters
```

### Relationship Endpoints

```http
GET    /api/reviews/booking/:bookingId    # Reviews for booking
GET    /api/reviews/reviewer/:reviewerId  # Reviews by reviewer
GET    /api/reviews/user/:userId          # Reviews for user
```

### Response Management

```http
POST   /api/reviews/:id/response         # Add response to review
```

### Moderation (Admin/Moderator Only)

```http
GET    /api/reviews/moderation/queue     # Get moderation queue
POST   /api/reviews/:id/moderate         # Moderate single review
POST   /api/reviews/moderation/bulk      # Bulk moderate reviews
```

### Analytics

```http
GET    /api/reviews/analytics/user/:userId  # User review analytics
GET    /api/reviews/analytics/stats         # System statistics
```

## Implementation Layers

### 1. Database Migration
- **File**: `database/migrations/20250705_create_reviews_table.ts`
- **Features**: Complete schema with constraints, indexes, and analytics views
- **Sample Data**: Pre-populated test data for development

### 2. TypeScript Types
- **File**: `src/types/review.types.ts`
- **Coverage**: Comprehensive type definitions for all review operations
- **Key Types**:
  - `ReviewData`: Main review interface
  - `CreateReviewData`, `UpdateReviewData`: Input types
  - `ReviewFilters`, `ReviewSearchParams`: Query types
  - `ModerationQueueItem`, `ModerationAction`: Moderation types
  - `UserReviewAnalytics`, `ReviewStats`: Analytics types

### 3. Repository Layer
- **File**: `src/repositories/ReviewRepository.ts`
- **Features**: In-memory CRUD operations with advanced filtering
- **Key Methods**:
  - Basic CRUD: `create()`, `findById()`, `update()`, `delete()`
  - Search: `findAll()` with comprehensive filtering
  - Relationships: `findByBookingId()`, `findByReviewerId()`, `findByReviewedUserId()`
  - Moderation: `getModerationQueue()`
  - Analytics: `getUserAnalytics()`, `getReviewStats()`

### 4. Service Layer
- **File**: `src/services/ReviewService.ts`
- **Features**: Business logic, validation, and AI integration
- **Key Features**:
  - **Review Creation**: Validation + AI analysis
  - **Update Logic**: Re-analysis on content changes
  - **Business Rules**: Self-review prevention, duplicate detection
  - **AI Analysis**: Simulated sentiment, toxicity, and helpfulness scoring
  - **Moderation**: Individual and bulk moderation workflows
  - **Validation**: Content length, spam detection, rating validation

### 5. Controller Layer
- **File**: `src/controllers/review.controller.ts`
- **Features**: HTTP request handling with comprehensive error management
- **Authentication**: Supports user context for permissions
- **Error Handling**: Consistent API response format
- **Query Processing**: Advanced query parameter parsing

### 6. Routes Layer
- **File**: `src/routes/review.routes.ts`
- **Features**: RESTful API design with comprehensive documentation
- **Route Organization**: Logical grouping with proper precedence
- **Documentation**: Inline API documentation with examples

## Key Business Rules

### Review Creation
- Users cannot review themselves
- Only one review per booking per user combination
- Overall rating is required (1-5 scale)
- AI analysis determines initial moderation status

### Review Updates
- Only reviewers can update content
- Content updates trigger re-analysis
- Rating and content validation on updates

### Review Deletion
- Only within 24 hours of creation
- Approved reviews cannot be deleted
- Soft delete maintains data integrity

### Review Responses
- Only reviewed users can respond
- One response per review
- No moderation required for responses

### Moderation
- AI flags potentially problematic content
- Human moderators can approve/reject/flag
- Bulk moderation for efficiency
- Moderation audit trail

## AI Content Analysis

The system includes simulated AI analysis that evaluates:

### Sentiment Score (-1 to 1)
- Analyzes positive vs negative language
- Based on keyword matching and context

### Toxicity Score (0 to 1)
- Detects inappropriate content
- Flags potential violations

### Helpfulness Score (0 to 1)
- Evaluates review utility
- Based on length and detail level

### Auto-flagging
- High toxicity content
- Spam patterns
- Suspicious URLs

## Analytics Features

### User Analytics
- Total reviews received
- Average ratings across dimensions
- Response rate
- Flagged content ratio
- Verification status impact

### System Statistics
- Rating distribution
- Moderation status breakdown
- Response rates
- Monthly trends
- AI scoring distributions

## Security Considerations

### Input Validation
- Rating range validation (1-5)
- Content length limits
- Spam pattern detection
- XSS prevention

### Permission Control
- User authentication required
- Role-based moderation access
- Review ownership validation
- Response permission checking

### Rate Limiting
- Prevention of review spam
- API endpoint protection
- Bulk operation limits

## Integration Points

### Booking System
- Reviews linked to completed bookings
- Booking status validation
- User participation verification

### User System
- User authentication integration
- Profile enhancement with ratings
- Reputation scoring

### Notification System
- New review notifications
- Response notifications
- Moderation alerts

## Future Enhancements

### Advanced AI Features
- Real NLP integration
- Image content analysis
- Automated response suggestions
- Trend detection

### Enhanced Analytics
- Predictive analytics
- Fraud detection
- Market insights
- Performance benchmarking

### Workflow Improvements
- Automated moderation rules
- Review quality scoring
- Incentive systems
- Gamification elements

## Testing Strategy

### Unit Tests
- Repository methods
- Service business logic
- Controller error handling
- Type validation

### Integration Tests
- End-to-end API flows
- Database operations
- Authentication integration
- Error scenarios

### Performance Tests
- Large dataset handling
- Search performance
- Analytics calculation
- Concurrent operations

## Deployment Considerations

### Database Setup
- Run migration scripts
- Configure indexes
- Set up analytics views
- Initialize sample data

### Environment Configuration
- AI service endpoints
- Moderation settings
- Rate limiting rules
- Notification channels

### Monitoring
- Review creation rates
- Moderation queue size
- AI analysis performance
- Error rates and patterns

This comprehensive review system provides a solid foundation for user feedback and reputation management in the UrutiBiz platform.
