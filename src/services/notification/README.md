# 🚀 **UrutiBiz Notification System**

A robust, scalable notification engine built with Node.js, TypeScript, and PostgreSQL. This system supports multiple notification channels, templating, scheduling, and user preferences management.

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Engine                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Email     │ │    SMS      │ │    Push     │          │
│  │   Service   │ │   Service   │ │   Service   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Webhook    │ │  Template   │ │   Queue     │          │
│  │   Service   │ │   Service   │ │   Service   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Repository  │ │Preferences  │ │   Logger    │          │
│  │             │ │  Service    │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 **Features**

### **Multi-Channel Support**
- ✅ **Email**: SMTP-based email delivery with templates
- ✅ **SMS**: Twilio/AWS SNS integration
- ✅ **Push Notifications**: Firebase/OneSignal support
- ✅ **Webhooks**: HTTP endpoint notifications
- ✅ **In-App**: Real-time in-app notifications

### **Advanced Features**
- 🔄 **Templating**: Dynamic notification templates with variables
- ⏰ **Scheduling**: Future-dated notification delivery
- 📊 **Queue Management**: Reliable delivery with retry logic
- 👤 **User Preferences**: Granular notification control
- 🔇 **Quiet Hours**: Do-not-disturb functionality
- 📈 **Analytics**: Delivery statistics and monitoring
- 🚀 **Bulk Operations**: Mass notification support

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
npm install nodemailer axios
# Optional: npm install @twilio/sdk firebase-admin aws-sdk
```

### **2. Environment Variables**

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@urutibiz.com

# SMS Configuration (Optional)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Push Configuration (Optional)
PUSH_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Webhook Configuration
WEBHOOK_TIMEOUT=10000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RATE_LIMIT=60
```

### **3. Database Setup**

Run the migrations to create the required tables:

```bash
npm run migrate
```

### **4. Basic Usage**

```typescript
import NotificationEngine from '@/services/notification/NotificationEngine';

// Send immediate notification
const result = await NotificationEngine.sendNotification({
  type: 'inspection_scheduled',
  recipientId: 'user-123',
  title: 'Inspection Scheduled',
  message: 'Your inspection has been scheduled for tomorrow.',
  channels: ['email', 'push']
});

// Send templated notification
const result = await NotificationEngine.sendTemplatedNotification(
  'inspection_scheduled',
  'user-123',
  {
    recipientName: 'John Doe',
    productName: 'iPhone 12',
    scheduledDate: '2025-01-15',
    scheduledTime: '10:00 AM',
    location: '123 Main St',
    inspectorName: 'Jane Smith',
    inspectionType: 'pre_rental'
  }
);

// Schedule notification
const scheduledAt = new Date();
scheduledAt.setHours(scheduledAt.getHours() + 24); // 24 hours from now

await NotificationEngine.scheduleNotification(
  {
    type: 'reminder',
    recipientId: 'user-123',
    title: 'Inspection Reminder',
    message: 'Don\'t forget your inspection tomorrow!'
  },
  scheduledAt
);
```

## 📚 **API Reference**

### **Core Methods**

#### **`sendNotification(payload)`**
Send a notification immediately.

```typescript
interface NotificationPayload {
  type: NotificationType;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}
```

#### **`sendTemplatedNotification(templateName, recipientId, templateData, options?)`**
Send a notification using a predefined template.

#### **`scheduleNotification(payload, scheduledAt)`**
Schedule a notification for future delivery.

#### **`sendBulkNotifications(payloads)`**
Send multiple notifications at once.

### **Notification Types**

```typescript
enum NotificationType {
  // Inspection related
  INSPECTION_SCHEDULED = 'inspection_scheduled',
  INSPECTION_STARTED = 'inspection_started',
  INSPECTION_COMPLETED = 'inspection_completed',
  INSPECTION_CANCELLED = 'inspection_cancelled',
  INSPECTION_REMINDER = 'inspection_reminder',
  
  // Dispute related
  DISPUTE_RAISED = 'dispute_raised',
  DISPUTE_RESOLVED = 'dispute_resolved',
  DISPUTE_ESCALATED = 'dispute_escalated',
  
  // System related
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',
  
  // User related
  ACCOUNT_VERIFIED = 'account_verified',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATED = 'profile_updated'
}
```

### **Notification Channels**

```typescript
enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}
```

### **Priority Levels**

```typescript
enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

## 🎨 **Templates**

### **Built-in Templates**

The system comes with pre-built templates for common scenarios:

- **`inspection_scheduled`**: Product inspection scheduling
- **`inspection_started`**: Inspection commencement
- **`inspection_completed`**: Inspection completion
- **`dispute_raised`**: Dispute notification
- **`dispute_resolved`**: Dispute resolution
- **`reminder`**: General reminder notifications

### **Creating Custom Templates**

```typescript
import { NotificationTemplateService } from '@/services/notification/templates/NotificationTemplateService';

const templateService = new NotificationTemplateService();

const template = await templateService.createTemplate({
  name: 'custom_template',
  type: NotificationType.SYSTEM,
  title: 'Custom: {{title}}',
  message: `
    <h2>{{title}}</h2>
    <p>{{message}}</p>
    <p>Sent at: {{timestamp}}</p>
  `,
  channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
  priority: NotificationPriority.NORMAL,
  variables: ['title', 'message', 'timestamp'],
  isActive: true
});
```

## ⚙️ **Configuration**

### **Email Service**

```typescript
// Configure SMTP settings
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  },
  pool: true,
  maxConnections: 5,
  rateLimit: 14
};
```

### **SMS Service**

```typescript
// Twilio Configuration
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_NUMBER
};

// AWS SNS Configuration
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
};
```

### **Push Notifications**

```typescript
// Firebase Configuration
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

// OneSignal Configuration
const oneSignalConfig = {
  appId: process.env.ONESIGNAL_APP_ID,
  restApiKey: process.env.ONESIGNAL_REST_API_KEY
};
```

## 📊 **User Preferences**

### **Managing Preferences**

```typescript
import { NotificationPreferencesService } from '@/services/notification/preferences/NotificationPreferencesService';

const preferencesService = new NotificationPreferencesService();

// Update user preferences
await preferencesService.updateUserPreferences('user-123', {
  email: true,
  sms: false,
  push: true,
  inApp: true,
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC'
  }
});

// Check if user should receive notification
const shouldReceive = await preferencesService.shouldReceiveNotification(
  'user-123',
  'email',
  'inspection_scheduled'
);
```

## 🔄 **Queue Management**

### **Processing Scheduled Notifications**

```typescript
// Process all due notifications
await NotificationEngine.processScheduledNotifications();

// Set up cron job for regular processing
import cron from 'node-cron';

// Process every minute
cron.schedule('* * * * *', async () => {
  await NotificationEngine.processScheduledNotifications();
});
```

### **Queue Statistics**

```typescript
import { NotificationQueueService } from '@/services/notification/queue/NotificationQueueService';

const queueService = new NotificationQueueService();
const stats = await queueService.getQueueStatistics();

console.log('Queue Status:', stats);
// Output: { pending: 5, processing: 2, completed: 150, failed: 3, total: 160 }
```

## 📈 **Monitoring & Analytics**

### **Notification Statistics**

```typescript
const stats = await NotificationEngine.getStatistics();

console.log('Notification Stats:', stats);
// Output: {
//   total: 1000,
//   delivered: 950,
//   pending: 30,
//   failed: 20,
//   byType: { inspection_scheduled: 200, ... },
//   byChannel: { email: 800, push: 150, ... }
// }
```

### **Service Health Checks**

```typescript
// Check email service status
const emailStatus = await NotificationEngine.getEmailService().getStatus();

// Check push service status
const pushStatus = await NotificationEngine.getPushService().getStatus();

// Check webhook service status
const webhookStatus = await NotificationEngine.getWebhookService().getStatus();
```

## 🚨 **Error Handling**

### **Retry Logic**

The system automatically retries failed notifications with exponential backoff:

```typescript
// Configure retry settings
const retryConfig = {
  maxAttempts: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true
};
```

### **Error Logging**

All errors are logged with context:

```typescript
// Error logs include:
// - Error message
// - Notification details
// - Recipient information
// - Channel information
// - Timestamp
// - Stack trace
```

## 🔒 **Security Features**

### **Rate Limiting**

- **Email**: 14 messages per second
- **SMS**: 1 message per second
- **Webhook**: Configurable per endpoint
- **Push**: No rate limiting (handled by providers)

### **Input Validation**

- Payload validation
- URL validation for webhooks
- Email format validation
- Phone number validation
- Template variable validation

### **Access Control**

- JWT authentication required
- Role-based access control
- User can only access their own notifications
- Admin-only operations for system management

## 🧪 **Testing**

### **Unit Tests**

```bash
npm run test:unit -- --grep "Notification"
```

### **Integration Tests**

```bash
npm run test:integration -- --grep "Notification"
```

### **Manual Testing**

```bash
# Test email service
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inspection_scheduled",
    "recipientId": "user-123",
    "title": "Test Notification",
    "message": "This is a test notification"
  }'

# Test templated notification
curl -X POST http://localhost:3000/api/v1/notifications/send-templated \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "inspection_scheduled",
    "recipientId": "user-123",
    "templateData": {
      "recipientName": "John Doe",
      "productName": "Test Product",
      "scheduledDate": "2025-01-15"
    }
  }'
```

## 🚀 **Deployment**

### **Production Considerations**

1. **Database Indexes**: Ensure proper indexing on frequently queried fields
2. **Connection Pooling**: Configure appropriate connection limits
3. **Rate Limiting**: Implement application-level rate limiting
4. **Monitoring**: Set up alerts for failed notifications
5. **Backup**: Regular database backups for notification data
6. **Scaling**: Consider horizontal scaling for high-volume scenarios

### **Environment Variables**

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

## 🤝 **Contributing**

### **Adding New Channels**

1. Create new service class extending base channel interface
2. Implement required methods (`send`, `getStatus`, etc.)
3. Add to NotificationEngine
4. Update types and documentation
5. Add tests

### **Adding New Templates**

1. Create template in NotificationTemplateService
2. Define variables and structure
3. Add to default templates
4. Update documentation

## 📝 **License**

This notification system is part of the UrutiBiz platform and follows the same licensing terms.

## 🆘 **Support**

For issues and questions:

1. Check the logs for detailed error information
2. Review the API documentation
3. Check database connectivity
4. Verify environment variables
5. Contact the development team

---

**Built with ❤️ for UrutiBiz**
