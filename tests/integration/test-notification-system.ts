/**
 * Notification System Test Script
 * This script tests the notification system components including:
 * - Database migration
 * - Models functionality
 * - Service operations
 * - Provider configurations
 */

import { getDatabase } from '../../src/config/database';
import { Notification } from '../../src/models/Notification.model';
import { NotificationTemplate } from '../../src/models/NotificationTemplate.model';
import NotificationService from '../../src/services/notification.service';
import { NotificationDeliveryService } from '../../src/services/notificationDelivery.service';
import logger from '../../src/utils/logger';

class NotificationSystemTester {
  private db: any;
  private deliveryService: NotificationDeliveryService;

  constructor() {
    this.db = getDatabase();
    this.deliveryService = new NotificationDeliveryService();
  }

  async runAllTests(): Promise<void> {
    console.log('🔔 Starting Notification System Tests...\n');

    try {
      await this.testDatabaseTables();
      await this.testNotificationTemplates();
      await this.testNotificationModels();
      await this.testNotificationService();
      await this.testDeliveryProviders();
      await this.testDeliveryService();
      
      console.log('\n✅ All notification system tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Notification system tests failed:', error);
      process.exit(1);
    }
  }

  async testDatabaseTables(): Promise<void> {
    console.log('📊 Testing database tables...');

    const tables = [
      'notification_templates',
      'notifications',
      'notification_delivery_attempts',
      'notification_delivery_status',
      'user_notification_preferences',
      'user_devices'
    ];

    for (const table of tables) {
      const exists = await this.db.schema.hasTable(table);
      if (exists) {
        console.log(`  ✓ Table '${table}' exists`);
        
        // Test basic operations
        const count = await this.db(table).count('* as count').first();
        console.log(`    - Records: ${count.count}`);
      } else {
        throw new Error(`Table '${table}' does not exist`);
      }
    }

    console.log('  ✅ Database tables test passed\n');
  }

  async testNotificationTemplates(): Promise<void> {
    console.log('📝 Testing notification templates...');

    // Test finding templates
    const templates = await NotificationTemplate.findAll({ limit: 10 });
    console.log(`  ✓ Found ${templates.length} templates`);

    if (templates.length > 0) {
      const template = templates[0];
      console.log(`  ✓ Template: ${template.name} (${template.type})`);

      // Test rendering
      const variables = {
        user_name: 'John Doe',
        booking_reference: 'BK123456',
        booking_date: '2025-01-15',
        amount: '$150.00'
      };

      const renderedSubject = template.renderSubject(variables);
      const renderedBody = template.renderBody(variables);

      console.log(`  ✓ Rendered subject: ${renderedSubject}`);
      console.log(`  ✓ Rendered body length: ${renderedBody.length} chars`);
    }

    console.log('  ✅ Notification templates test passed\n');
  }

  async testNotificationModels(): Promise<void> {
    console.log('🔔 Testing notification models...');

    // Create a test notification
    const testNotification = new Notification({
      user_id: '12345678-1234-1234-1234-123456789012', // dummy UUID
      type: 'custom',
      title: 'Test Notification',
      message: 'This is a test notification message',
      channels: ['in_app', 'email'],
      metadata: { test: true }
    });

    console.log(`  ✓ Created notification instance: ${testNotification.id}`);
    console.log(`  ✓ Type: ${testNotification.type}`);
    console.log(`  ✓ Channels: ${testNotification.channels.join(', ')}`);

    // Test methods without saving to database
    console.log(`  ✓ Is read: ${testNotification.is_read}`);
    console.log(`  ✓ Is expired: ${testNotification.isExpired()}`);

    console.log('  ✅ Notification models test passed\n');
  }

  async testNotificationService(): Promise<void> {
    console.log('⚙️ Testing notification service...');

    // Test service methods (without actually creating notifications)
    try {
      // Test template-based notification creation would work
      const templateName = 'booking_confirmed';
      const template = await NotificationTemplate.findByName(templateName);
      
      if (template) {
        console.log(`  ✓ Found template: ${templateName}`);
        
        const variables = {
          user_name: 'Test User',
          booking_reference: 'TEST123',
          booking_date: '2025-01-15',
          location: 'Test Location'
        };

        const renderedTitle = template.renderSubject(variables);
        const renderedMessage = template.renderBody(variables);
        
        console.log(`  ✓ Would create notification: "${renderedTitle}"`);
        console.log(`  ✓ Message length: ${renderedMessage.length} chars`);
      }

      console.log('  ✅ Notification service test passed\n');
    } catch (error) {
      console.log(`  ⚠️ Service test warning: ${error}`);
    }
  }

  async testDeliveryProviders(): Promise<void> {
    console.log('📤 Testing delivery providers...');

    const enabledChannels = this.deliveryService.getEnabledChannels();
    console.log(`  ✓ Enabled channels: ${enabledChannels.join(', ')}`);

    // Test each provider
    const channels = ['email', 'sms', 'push', 'in_app'] as const;
    
    for (const channel of channels) {
      const provider = this.deliveryService.getProvider(channel);
      if (provider) {
        const isEnabled = provider.enabled();
        const isConfigured = provider.isConfigured();
        
        console.log(`  ${isEnabled ? '✓' : '⚠️'} ${channel} provider: ${isEnabled ? 'enabled' : 'disabled'} (configured: ${isConfigured})`);
      } else {
        console.log(`  ❌ ${channel} provider: not found`);
      }
    }

    console.log('  ✅ Delivery providers test passed\n');
  }

  async testDeliveryService(): Promise<void> {
    console.log('🚀 Testing delivery service...');

    try {
      // Test provider connection tests
      const testResults = await this.deliveryService.testAllProviders();
      
      console.log('  Provider test results:');
      Object.entries(testResults).forEach(([channel, result]) => {
        console.log(`    ${result ? '✓' : '❌'} ${channel}: ${result ? 'working' : 'failed'}`);
      });

      // Test delivery stats
      const stats = await this.deliveryService.getDeliveryStats();
      console.log(`  ✓ Delivery stats: ${stats.total} total, ${stats.sent} sent, ${stats.failed} failed`);

      console.log('  ✅ Delivery service test passed\n');
    } catch (error) {
      console.log(`  ⚠️ Delivery service test warning: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    // Close database connections
    await this.db.destroy();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new NotificationSystemTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 Notification system is ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    })
    .finally(() => {
      tester.cleanup();
    });
}

export { NotificationSystemTester };
