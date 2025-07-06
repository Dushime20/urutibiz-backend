# Notification System Documentation

## Overview

The UrutiBiz notification system is a comprehensive, multi-channel notification platform that supports email, SMS, push notifications, and in-app messaging. The system is built with TypeScript, uses Knex.js for database operations, and follows a modular provider architecture for delivery channels.

## Architecture

### Core Components

1. **Models** (`src/models/`)
   - `NotificationTemplate.model.ts` - Template management with variable rendering
   - `Notification.model.ts` - Individual notification records

2. **Services** (`src/services/`)
   - `notification.service.ts` - Main service for creating and managing notifications
   - `notificationDelivery.service.ts` - Handles delivery across multiple channels

3. **Providers** (`src/providers/`)
   - `BaseNotificationProvider.ts` - Abstract base class for all providers
   - `EmailProvider.ts` - Email delivery via SMTP/nodemailer
   - `SMSProvider.ts` - SMS delivery (Twilio-compatible)
   - `PushProvider.ts` - Push notifications via FCM
   - `InAppProvider.ts` - In-app notification storage

4. **Types** (`src/types/notification.types.ts`)
   - Comprehensive TypeScript definitions for all notification-related data

5. **Routes** (`src/routes/notifications.routes.ts`)
   - REST API endpoints for notification management

6. **Database**
   - Migration files for all required tables
   - Indexes optimized for performance

## Database Schema

### Core Tables

#### `notification_templates`
- Template definitions with variable placeholders
- Support for multiple languages and channels
- Subject and body templates with Handlebars-style variables

#### `notifications`
- Individual notification records
- Supports multiple delivery channels per notification
- Tracks read status, expiration, and metadata

#### `notification_delivery_attempts`
- Detailed delivery attempt tracking
- Retry mechanism with configurable limits
- Provider-specific error handling

#### `notification_delivery_status`
- Current delivery status per channel
- External message ID tracking
- Delivery confirmation timestamps

#### `user_notification_preferences`
- User-specific channel preferences
- Per-type notification settings
- Quiet hours and frequency controls

#### `user_devices`
- Device registration for push notifications
- FCM/APNS token management
- Multi-device support per user

## Features

### 1. Multi-Channel Delivery
- **Email**: HTML/text emails with templates, SMTP support
- **SMS**: Text messages with length optimization
- **Push**: FCM-based push notifications for web/mobile
- **In-App**: Database-stored notifications for real-time display

### 2. Template System
- Variable substitution using `{{variable}}` syntax
- Multi-language support
- Template versioning and activation controls
- Default templates for common scenarios

### 3. Delivery Management
- Automatic retry mechanism for failed deliveries
- Provider health monitoring
- Delivery statistics and reporting
- User preference handling

### 4. User Experience
- Read/unread status tracking
- Bulk operations (mark all as read)
- Notification expiration
- Action URLs for deep linking

## API Endpoints

### User Endpoints

#### `GET /api/notifications`
Get user notifications with filtering and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `type` - Filter by notification type
- `channel` - Filter by delivery channel
- `is_read` - Filter by read status
- `from_date`, `to_date` - Date range filtering
- `sortBy`, `sortOrder` - Sorting options

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {...},
    "unreadCount": 5
  }
}
```

#### `GET /api/notifications/unread-count`
Get count of unread notifications.

#### `GET /api/notifications/unread`
Get all unread notifications.

#### `PATCH /api/notifications/{id}/read`
Mark specific notification as read.

#### `PATCH /api/notifications/mark-all-read`
Mark all user notifications as read.

#### `DELETE /api/notifications/{id}`
Delete specific notification.

### Admin Endpoints

#### `POST /api/notifications/admin/create`
Create single notification (admin only).

**Request Body:**
```json
{
  "user_id": "uuid",
  "type": "booking_confirmed",
  "title": "Booking Confirmed",
  "message": "Your booking has been confirmed...",
  "channels": ["email", "push"],
  "action_url": "/bookings/123",
  "metadata": {...}
}
```

#### `POST /api/notifications/admin/bulk`
Create bulk notifications.

#### `GET /api/notifications/admin/templates`
Get notification templates.

#### `POST /api/notifications/admin/templates`
Create new template.

#### `PUT /api/notifications/admin/templates/{id}`
Update existing template.

#### `GET /api/notifications/admin/delivery-stats`
Get delivery statistics.

#### `POST /api/notifications/admin/test-providers`
Test all notification providers.

#### `POST /api/notifications/admin/retry-failed`
Retry failed deliveries.

## Usage Examples

### 1. Creating a Simple Notification

```typescript
import NotificationService from '@/services/notification.service';

const notification = await NotificationService.createNotification({
  user_id: '12345678-1234-1234-1234-123456789012',
  type: 'custom',
  title: 'Welcome to UrutiBiz!',
  message: 'Thank you for joining our platform.',
  channels: ['email', 'in_app'],
  action_url: '/dashboard'
});
```

### 2. Using Templates

```typescript
const notification = await NotificationService.createFromTemplate(
  'booking_confirmed',
  userId,
  {
    user_name: 'John Doe',
    booking_reference: 'BK123456',
    booking_date: '2025-01-15',
    location: 'New York City'
  },
  {
    channels: ['email', 'push', 'in_app'],
    action_url: `/bookings/${bookingId}`
  }
);
```

### 3. Bulk Notifications

```typescript
const notifications = await NotificationService.createBulkNotifications({
  user_ids: ['user1', 'user2', 'user3'],
  template_name: 'payment_received',
  metadata: {
    amount: '$150.00',
    transaction_id: 'TXN123'
  },
  channels: ['email'],
  action_url: '/payments/TXN123'
});
```

### 4. Context-Specific Helpers

```typescript
// Booking confirmation
await NotificationService.notifyBookingConfirmed(userId, {
  booking_reference: 'BK123',
  booking_date: '2025-01-15',
  location: 'Hotel ABC'
});

// Payment received
await NotificationService.notifyPaymentReceived(userId, {
  amount: '$150.00',
  transaction_id: 'TXN123',
  payment_method: 'Credit Card'
});

// Verification complete
await NotificationService.notifyVerificationComplete(userId);
```

## Configuration

### Environment Variables

#### Email Provider (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@urutibiz.com
SMTP_FROM_NAME=UrutiBiz
SMTP_SECURE=false
SMTP_TLS_REJECT_UNAUTHORIZED=true
```

#### SMS Provider (Twilio)
```bash
SMS_API_KEY=your-twilio-auth-token
SMS_API_URL=https://api.twilio.com/2010-04-01
SMS_ACCOUNT_SID=your-account-sid
SMS_AUTH_TOKEN=your-auth-token
SMS_SENDER_ID=UrutiBiz
```

#### Push Provider (FCM)
```bash
FCM_SERVER_KEY=your-fcm-server-key
FCM_API_URL=https://fcm.googleapis.com/fcm/send
```

#### General Settings
```bash
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY=300000
BRAND_COLOR=#007bff
COMPANY_NAME=UrutiBiz
APP_URL=https://urutibiz.com
```

## Provider Implementation

### Adding a New Provider

1. Create a new provider class extending `BaseNotificationProvider`:

```typescript
import { BaseNotificationProvider, NotificationPayload, DeliveryResult } from './BaseNotificationProvider';

export class CustomProvider extends BaseNotificationProvider {
  constructor() {
    super('CustomProvider', 'custom_channel');
  }

  protected checkConfiguration(): boolean {
    // Check required environment variables
    return !!process.env.CUSTOM_API_KEY;
  }

  public isConfigured(): boolean {
    return this.isEnabled;
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      // Implementation
      return this.createSuccessResult('message-id');
    } catch (error) {
      return this.handleError(error, 'send');
    }
  }
}
```

2. Register in `NotificationDeliveryService`:

```typescript
const customProvider = new CustomProvider();
this.providers.set('custom_channel', customProvider);
```

## Error Handling

The notification system includes comprehensive error handling:

### 1. Provider Failures
- Automatic retry with exponential backoff
- Circuit breaker pattern for repeated failures
- Fallback to alternative channels when possible

### 2. Database Errors
- Transaction rollback for bulk operations
- Consistent error logging and monitoring
- Graceful degradation for non-critical failures

### 3. Validation Errors
- Input validation at API level
- Template variable validation
- User permission checks

## Monitoring and Metrics

### 1. Delivery Statistics
- Success/failure rates per channel
- Average delivery times
- Retry attempt tracking

### 2. Provider Health
- Connection test endpoints
- Provider-specific error rates
- Configuration validation

### 3. User Engagement
- Read rates by notification type
- Channel preference analysis
- Unsubscribe tracking

## Performance Considerations

### 1. Database Optimization
- Proper indexing for query patterns
- Partitioning for high-volume deployments
- Cleanup jobs for expired notifications

### 2. Delivery Optimization
- Batch processing for bulk operations
- Rate limiting per provider
- Connection pooling for SMTP

### 3. Caching
- Template caching for frequently used templates
- User preference caching
- Provider configuration caching

## Security

### 1. Data Protection
- Encryption of sensitive provider credentials
- PII handling in notification content
- Secure token management for external APIs

### 2. Access Control
- Role-based access for admin functions
- User-level notification privacy
- API rate limiting

### 3. Audit Trail
- Delivery attempt logging
- Admin action tracking
- User preference change logging

## Testing

### Running Tests

```bash
# Run the notification system test suite
node test-notification-system.js

# Run specific integration tests
npm run test test-notification-system-integration.js

# Run end-to-end tests
npm run test test-notification-system-e2e.js
```

### Test Coverage
- Unit tests for all models and services
- Integration tests for delivery providers
- End-to-end tests for complete workflows
- Load testing for bulk operations

## Deployment

### 1. Database Migration
```bash
# Run migrations
npm run migrate

# Verify tables
npm run db:status
```

### 2. Provider Configuration
- Set up SMTP credentials
- Configure external APIs (Twilio, FCM)
- Test provider connections

### 3. Monitoring Setup
- Configure logging levels
- Set up alerting for delivery failures
- Monitor provider health endpoints

## Troubleshooting

### Common Issues

#### 1. Email Delivery Failures
- Check SMTP credentials and server connectivity
- Verify DNS records for sending domain
- Check spam filters and reputation

#### 2. Push Notification Issues
- Validate FCM server key
- Check device token validity
- Verify app configuration

#### 3. Template Rendering Errors
- Validate template syntax
- Check variable availability
- Test with sample data

#### 4. Database Performance
- Monitor query performance
- Check index usage
- Optimize bulk operations

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

This will provide detailed logging for all notification operations.

## Roadmap

### Short Term
- [ ] WebSocket integration for real-time notifications
- [ ] Rich push notification support
- [ ] Email template builder UI
- [ ] Advanced user preferences

### Medium Term
- [ ] Multi-tenant support
- [ ] A/B testing for notification content
- [ ] Analytics dashboard
- [ ] Notification scheduling

### Long Term
- [ ] Machine learning for delivery optimization
- [ ] Cross-platform notification sync
- [ ] Advanced personalization
- [ ] Compliance automation (GDPR, CAN-SPAM)

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the test suite for usage examples
- Consult the API documentation
- Contact the development team

---

**UrutiBiz Notification System** - Reliable, scalable, multi-channel communication platform.
