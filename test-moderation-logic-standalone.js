#!/usr/bin/env node

/**
 * Moderation & Content Analysis System Logic Tests (Standalone)
 * 
 * Tests core moderation business logic without external dependencies
 * Focuses on validation, algorithms, content analysis, and moderation workflows
 */

console.log('🛡️ Testing Moderation & Content Analysis System Logic (Standalone)');
console.log('============================================================');

// Test Results Tracking
let totalTests = 0;
let passedTests = 0;
const testResults = [];

function runTest(testName, testFunction) {
  totalTests++;
  try {
    testFunction();
    passedTests++;
    console.log(`✅ ${testName}: All validations work correctly`);
    testResults.push({ name: testName, status: 'PASS' });
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    testResults.push({ name: testName, status: 'FAIL', error: error.message });
  }
}

// =====================================================
// CONTENT ANALYSIS LOGIC TESTS
// =====================================================

console.log('🔍 Testing Content Analysis Logic...');
runTest('Content Analysis Logic', () => {
  // Text toxicity analysis
  const analyzeToxicity = (text) => {
    if (!text) return 0;
    
    const toxicWords = ['hate', 'stupid', 'idiot', 'kill', 'die', 'worthless', 'garbage'];
    const words = text.toLowerCase().split(/\s+/);
    
    let toxicCount = 0;
    words.forEach(word => {
      if (toxicWords.some(toxic => word.includes(toxic))) {
        toxicCount++;
      }
    });
    
    return Math.min(1, toxicCount / words.length * 10);
  };

  // Profanity detection
  const detectProfanity = (text) => {
    if (!text) return 0;
    
    const profanityWords = ['damn', 'hell', 'crap', 'stupid', 'dumb'];
    const words = text.toLowerCase().split(/\s+/);
    
    let profanityCount = 0;
    words.forEach(word => {
      if (profanityWords.some(profane => word.includes(profane))) {
        profanityCount++;
      }
    });
    
    return Math.min(1, profanityCount / words.length * 5);
  };

  // Spam detection
  const detectSpam = (text) => {
    if (!text) return 0;
    
    const spamIndicators = [
      /\b(?:buy|sale|discount|offer|deal|free|win|prize)\b/gi,
      /\b(?:click|visit|website|link|url)\b/gi,
      /(?:www\.|http|@)/gi
    ];
    
    let spamScore = 0;
    spamIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) spamScore += matches.length * 0.2;
    });
    
    return Math.min(1, spamScore);
  };

  // Sentiment analysis
  const analyzeSentiment = (text) => {
    if (!text) return 0;
    
    const positiveWords = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'perfect', 'love'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'disgusting'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length * 5));
  };

  // Topic classification
  const classifyTopics = (text) => {
    if (!text) return [];
    
    const topicKeywords = {
      'product': ['item', 'product', 'quality', 'condition', 'brand'],
      'service': ['service', 'support', 'help', 'staff', 'team'],
      'price': ['price', 'cost', 'expensive', 'cheap', 'value', 'money'],
      'delivery': ['delivery', 'shipping', 'arrival', 'time', 'fast', 'slow']
    };
    
    const words = text.toLowerCase().split(/\s+/);
    const topics = [];
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = words.filter(word => keywords.some(keyword => word.includes(keyword)));
      if (matches.length > 0) {
        topics.push(topic);
      }
    });
    
    return topics;
  };

  // Test content analysis functions
  const toxicText = 'You are so stupid and worthless, I hate you';
  const cleanText = 'This is a great product with excellent quality';
  const spamText = 'Buy now! Visit our website www.spam.com for amazing deals!';
  const neutralText = 'The item arrived on time and was as described';

  // Test toxicity detection
  const toxicScore = analyzeToxicity(toxicText);
  const cleanToxicScore = analyzeToxicity(cleanText);
  
  if (toxicScore <= 0.1) {
    throw new Error('Toxic text should have high toxicity score');
  }
  if (cleanToxicScore > 0.1) {
    throw new Error('Clean text should have low toxicity score');
  }

  // Test profanity detection
  const profanityText = 'This is damn stupid and hell of a problem';
  const profanityScore = detectProfanity(profanityText);
  const cleanProfanityScore = detectProfanity(cleanText);
  
  if (profanityScore <= 0) {
    throw new Error('Profanity text should be detected');
  }
  if (cleanProfanityScore > 0) {
    throw new Error('Clean text should not trigger profanity detection');
  }

  // Test spam detection
  const spamScore = detectSpam(spamText);
  const cleanSpamScore = detectSpam(cleanText);
  
  if (spamScore <= 0.1) {
    throw new Error('Spam text should have high spam score');
  }
  if (cleanSpamScore > 0.1) {
    throw new Error('Clean text should have low spam score');
  }

  // Test sentiment analysis
  const positiveSentiment = analyzeSentiment(cleanText);
  const negativeSentiment = analyzeSentiment(toxicText);
  
  if (positiveSentiment <= 0) {
    throw new Error('Positive text should have positive sentiment');
  }
  if (negativeSentiment >= 0) {
    throw new Error('Negative text should have negative sentiment');
  }

  // Test topic classification
  const productTopics = classifyTopics('This product has excellent quality and great value');
  const serviceTopics = classifyTopics('The customer service team was very helpful');
  
  if (!productTopics.includes('product') || !productTopics.includes('price')) {
    throw new Error('Product topics should be detected');
  }
  if (!serviceTopics.includes('service')) {
    throw new Error('Service topics should be detected');
  }
});

// =====================================================
// MODERATION RULE ENGINE LOGIC TESTS
// =====================================================

console.log('🔍 Testing Moderation Rule Engine Logic...');
runTest('Moderation Rule Engine Logic', () => {
  // Rule evaluation logic
  const evaluateCondition = (condition, content) => {
    const { field, operator, value, weight } = condition;
    
    let fieldValue = content[field];
    if (fieldValue === undefined) return 0;
    
    let matches = false;
    
    switch (operator) {
      case 'contains':
        matches = fieldValue.toString().toLowerCase().includes(value.toString().toLowerCase());
        break;
      case 'equals':
        matches = fieldValue === value;
        break;
      case 'gt':
        matches = parseFloat(fieldValue) > parseFloat(value);
        break;
      case 'lt':
        matches = parseFloat(fieldValue) < parseFloat(value);
        break;
      case 'gte':
        matches = parseFloat(fieldValue) >= parseFloat(value);
        break;
      case 'lte':
        matches = parseFloat(fieldValue) <= parseFloat(value);
        break;
      case 'regex':
        matches = new RegExp(value).test(fieldValue.toString());
        break;
      case 'ml_confidence':
        matches = parseFloat(fieldValue) >= parseFloat(value);
        break;
    }
    
    return matches ? weight : 0;
  };

  // Rule evaluation with multiple conditions
  const evaluateRule = (rule, content) => {
    if (!rule.enabled) return { triggered: false, score: 0, conditions: [] };
    
    let totalScore = 0;
    const triggeredConditions = [];
    
    rule.conditions.forEach(condition => {
      const conditionScore = evaluateCondition(condition, content);
      if (conditionScore > 0) {
        totalScore += conditionScore;
        triggeredConditions.push(condition.field);
      }
    });
    
    const triggered = totalScore >= rule.thresholds.autoAction;
    
    return {
      triggered,
      score: totalScore,
      conditions: triggeredConditions,
      severity: rule.severity,
      actions: triggered ? rule.actions : []
    };
  };

  // Action prioritization
  const prioritizeActions = (actions) => {
    const priority = {
      'ban': 10,
      'suspend': 8,
      'quarantine': 6,
      'auto_reject': 5,
      'require_review': 4,
      'flag': 3,
      'warn': 2
    };
    
    return actions.sort((a, b) => (priority[b.type] || 0) - (priority[a.type] || 0));
  };

  // Test rule evaluation
  const testRule = {
    id: 'toxic-content-rule',
    name: 'Toxic Content Detection',
    type: 'content',
    category: 'review',
    severity: 'high',
    enabled: true,
    conditions: [
      { field: 'toxicity', operator: 'gt', value: 0.7, weight: 1 },
      { field: 'text', operator: 'contains', value: 'hate', weight: 0.5 }
    ],
    actions: [
      { type: 'flag', notification: true },
      { type: 'require_review', escalation: true }
    ],
    thresholds: {
      autoAction: 1,
      humanReview: 0.5,
      immediate: 1.5
    }
  };

  const toxicContent = {
    toxicity: 0.8,
    text: 'I hate this stupid product',
    sentiment: -0.9
  };

  const cleanContent = {
    toxicity: 0.1,
    text: 'This is a great product',
    sentiment: 0.8
  };

  // Test toxic content triggers rule
  const toxicResult = evaluateRule(testRule, toxicContent);
  if (!toxicResult.triggered) {
    throw new Error('Toxic content should trigger moderation rule');
  }
  if (toxicResult.conditions.length !== 2) {
    throw new Error('Both conditions should be triggered for toxic content');
  }

  // Test clean content doesn't trigger rule
  const cleanResult = evaluateRule(testRule, cleanContent);
  if (cleanResult.triggered) {
    throw new Error('Clean content should not trigger moderation rule');
  }

  // Test disabled rule
  const disabledRule = { ...testRule, enabled: false };
  const disabledResult = evaluateRule(disabledRule, toxicContent);
  if (disabledResult.triggered) {
    throw new Error('Disabled rule should not trigger');
  }

  // Test action prioritization
  const actions = [
    { type: 'warn' },
    { type: 'ban' },
    { type: 'flag' },
    { type: 'suspend' }
  ];
  const prioritized = prioritizeActions(actions);
  if (prioritized[0].type !== 'ban') {
    throw new Error('Ban should be highest priority action');
  }
  if (prioritized[prioritized.length - 1].type !== 'warn') {
    throw new Error('Warn should be lowest priority action');
  }
});

// =====================================================
// BEHAVIOR ANALYSIS LOGIC TESTS
// =====================================================

console.log('🔍 Testing Behavior Analysis Logic...');
runTest('Behavior Analysis Logic', () => {
  // Anomaly detection for user behavior
  const detectBehaviorAnomalies = (userMetrics, normalRanges) => {
    const anomalies = {};
    
    // Check for rapid signups (multiple accounts in short time)
    if (userMetrics.accountAge < 1 && userMetrics.activityLevel > 50) {
      anomalies.rapidSignups = true;
    }
    
    // Check for suspicious login patterns
    if (userMetrics.loginFrequency > normalRanges.loginFrequency.max * 3) {
      anomalies.suspiciousIPs = true;
    }
    
    // Check for bulk actions
    if (userMetrics.actionsPerHour > normalRanges.actionsPerHour.max * 2) {
      anomalies.bulkActions = true;
    }
    
    // Check for coordinated behavior
    if (userMetrics.coordinationScore > 0.8) {
      anomalies.coordinatedBehavior = true;
    }
    
    return anomalies;
  };

  // Risk score calculation
  const calculateRiskScore = (userMetrics, anomalies) => {
    let riskScore = 0;
    
    // Base risk factors
    if (userMetrics.accountAge < 7) riskScore += 0.2;
    if (userMetrics.reportCount > 0) riskScore += userMetrics.reportCount * 0.1;
    if (userMetrics.cancellationRate > 0.3) riskScore += 0.3;
    
    // Anomaly factors
    Object.values(anomalies).forEach(hasAnomaly => {
      if (hasAnomaly) riskScore += 0.25;
    });
    
    // Pattern factors
    if (userMetrics.responseTime > 3600) riskScore += 0.1; // Very slow responses
    if (userMetrics.sessionDuration < 60) riskScore += 0.1; // Very short sessions
    
    return Math.min(1, riskScore);
  };

  // Behavioral pattern recognition
  const recognizePatterns = (userHistory) => {
    const patterns = [];
    
    // Detect bot-like behavior
    const consistentTiming = userHistory.filter(action => 
      action.timing % 60 === 0 // Actions exactly on minute marks
    );
    if (consistentTiming.length > userHistory.length * 0.7) {
      patterns.push('bot-like-timing');
    }
    
    // Detect mass booking pattern
    const recentBookings = userHistory.filter(action => 
      action.type === 'booking' && action.timestamp > Date.now() - 86400000
    );
    if (recentBookings.length > 10) {
      patterns.push('mass-booking');
    }
    
    // Detect review farming
    const recentReviews = userHistory.filter(action => 
      action.type === 'review' && action.timestamp > Date.now() - 86400000
    );
    if (recentReviews.length > 20) {
      patterns.push('review-farming');
    }
    
    return patterns;
  };

  // Test behavior analysis
  const normalRanges = {
    loginFrequency: { min: 1, max: 10 },
    actionsPerHour: { min: 1, max: 20 },
    sessionDuration: { min: 300, max: 3600 }
  };

  const suspiciousUser = {
    accountAge: 0.5, // Half day old
    activityLevel: 100,
    loginFrequency: 50,
    actionsPerHour: 60,
    coordinationScore: 0.9,
    reportCount: 2,
    cancellationRate: 0.6,
    responseTime: 4000,
    sessionDuration: 30
  };

  const normalUser = {
    accountAge: 30,
    activityLevel: 10,
    loginFrequency: 3,
    actionsPerHour: 5,
    coordinationScore: 0.1,
    reportCount: 0,
    cancellationRate: 0.1,
    responseTime: 300,
    sessionDuration: 1800
  };

  // Test anomaly detection
  const suspiciousAnomalies = detectBehaviorAnomalies(suspiciousUser, normalRanges);
  const normalAnomalies = detectBehaviorAnomalies(normalUser, normalRanges);

  if (!suspiciousAnomalies.rapidSignups) {
    throw new Error('Should detect rapid signups for suspicious user');
  }
  if (!suspiciousAnomalies.suspiciousIPs) {
    throw new Error('Should detect suspicious IPs for suspicious user');
  }
  if (Object.keys(normalAnomalies).length > 0) {
    throw new Error('Normal user should not trigger anomalies');
  }

  // Test risk score calculation
  const suspiciousRisk = calculateRiskScore(suspiciousUser, suspiciousAnomalies);
  const normalRisk = calculateRiskScore(normalUser, normalAnomalies);

  if (suspiciousRisk < 0.7) {
    throw new Error('Suspicious user should have high risk score');
  }
  if (normalRisk > 0.3) {
    throw new Error('Normal user should have low risk score');
  }

  // Test pattern recognition
  const botHistory = Array.from({ length: 10 }, (_, i) => ({
    type: 'action',
    timing: i * 60, // Every minute exactly
    timestamp: Date.now() - i * 60000
  }));

  const normalHistory = Array.from({ length: 10 }, (_, i) => ({
    type: 'action',
    timing: Math.random() * 3600, // Random timing
    timestamp: Date.now() - i * Math.random() * 86400000
  }));

  const botPatterns = recognizePatterns(botHistory);
  const normalPatterns = recognizePatterns(normalHistory);

  if (!botPatterns.includes('bot-like-timing')) {
    throw new Error('Should detect bot-like timing patterns');
  }
  if (normalPatterns.includes('bot-like-timing')) {
    throw new Error('Normal user should not show bot patterns');
  }
});

// =====================================================
// FRAUD DETECTION LOGIC TESTS
// =====================================================

console.log('🔍 Testing Fraud Detection Logic...');
runTest('Fraud Detection Logic', () => {
  // Price anomaly detection
  const detectPriceAnomaly = (bookingPrice, marketPrices) => {
    if (!marketPrices || marketPrices.length === 0) return 0;
    
    const avgPrice = marketPrices.reduce((sum, price) => sum + price, 0) / marketPrices.length;
    const deviation = Math.abs(bookingPrice - avgPrice) / avgPrice;
    
    // Anomaly if price deviates more than 50% from average
    return deviation > 0.5 ? Math.min(1, deviation) : 0;
  };

  // Location mismatch detection
  const detectLocationMismatch = (userLocation, bookingLocation, ipLocation) => {
    // Simple distance calculation (stub)
    const distance = (loc1, loc2) => {
      const latDiff = Math.abs(loc1.lat - loc2.lat);
      const lonDiff = Math.abs(loc1.lon - loc2.lon);
      return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
    };
    
    const userBookingDistance = distance(userLocation, bookingLocation);
    const userIpDistance = distance(userLocation, ipLocation);
    
    // Flag if distances are suspiciously large
    return userBookingDistance > 10 || userIpDistance > 5;
  };

  // Payment anomaly detection
  const detectPaymentAnomalies = (paymentData, userPaymentHistory) => {
    const anomalies = [];
    
    // Check for new payment method
    const hasUsedBefore = userPaymentHistory.some(payment => 
      payment.method === paymentData.method &&
      payment.lastFour === paymentData.lastFour
    );
    
    if (!hasUsedBefore && paymentData.amount > 500) {
      anomalies.push('new-high-value-payment');
    }
    
    // Check for rapid payments
    const recentPayments = userPaymentHistory.filter(payment => 
      Date.now() - payment.timestamp < 3600000 // Last hour
    );
    
    if (recentPayments.length > 5) {
      anomalies.push('rapid-payments');
    }
    
    // Check for payment method inconsistency
    const primaryMethod = userPaymentHistory
      .reduce((acc, payment) => {
        acc[payment.method] = (acc[payment.method] || 0) + 1;
        return acc;
      }, {});
    
    const mostUsedMethod = Object.keys(primaryMethod)
      .reduce((a, b) => primaryMethod[a] > primaryMethod[b] ? a : b);
    
    if (paymentData.method !== mostUsedMethod && paymentData.amount > 1000) {
      anomalies.push('unusual-payment-method');
    }
    
    return anomalies;
  };

  // Overall fraud risk calculation
  const calculateFraudRisk = (indicators) => {
    let riskScore = 0;
    
    // Weight different risk factors
    if (indicators.rapidBooking) riskScore += 0.3;
    if (indicators.newAccount) riskScore += 0.2;
    if (indicators.locationMismatch) riskScore += 0.25;
    if (indicators.paymentAnomalies.length > 0) riskScore += indicators.paymentAnomalies.length * 0.15;
    if (indicators.priceManipulation) riskScore += 0.4;
    if (indicators.coordinatedAttack) riskScore += 0.5;
    
    return Math.min(1, riskScore);
  };

  // Test fraud detection
  const marketPrices = [100, 120, 110, 130, 105];
  
  // Test price anomaly detection
  const normalPrice = 115;
  const anomalyPrice = 300;
  
  const normalPriceAnomaly = detectPriceAnomaly(normalPrice, marketPrices);
  const highPriceAnomaly = detectPriceAnomaly(anomalyPrice, marketPrices);
  
  if (normalPriceAnomaly > 0.2) {
    throw new Error('Normal price should not trigger anomaly detection');
  }
  if (highPriceAnomaly < 0.5) {
    throw new Error('Anomalous price should be detected');
  }

  // Test location mismatch detection
  const userLoc = { lat: 40.7128, lon: -74.0060 }; // NYC
  const normalBookingLoc = { lat: 40.7500, lon: -74.0000 }; // Near NYC
  const distantBookingLoc = { lat: 34.0522, lon: -118.2437 }; // LA
  const normalIpLoc = { lat: 40.7000, lon: -74.0100 }; // Near NYC
  const suspiciousIpLoc = { lat: 51.5074, lon: -0.1278 }; // London
  
  const normalLocationCheck = detectLocationMismatch(userLoc, normalBookingLoc, normalIpLoc);
  const suspiciousLocationCheck = detectLocationMismatch(userLoc, distantBookingLoc, suspiciousIpLoc);
  
  if (normalLocationCheck) {
    throw new Error('Normal locations should not trigger mismatch');
  }
  if (!suspiciousLocationCheck) {
    throw new Error('Suspicious locations should trigger mismatch');
  }

  // Test payment anomaly detection
  const normalPayment = {
    method: 'credit_card',
    lastFour: '1234',
    amount: 100
  };
  
  const suspiciousPayment = {
    method: 'bitcoin',
    lastFour: '5678',
    amount: 2000
  };
  
  const paymentHistory = [
    { method: 'credit_card', lastFour: '1234', timestamp: Date.now() - 86400000 },
    { method: 'credit_card', lastFour: '1234', timestamp: Date.now() - 172800000 }
  ];
  
  const normalPaymentAnomalies = detectPaymentAnomalies(normalPayment, paymentHistory);
  const suspiciousPaymentAnomalies = detectPaymentAnomalies(suspiciousPayment, paymentHistory);
  
  if (normalPaymentAnomalies.length > 0) {
    throw new Error('Normal payment should not trigger anomalies');
  }
  if (suspiciousPaymentAnomalies.length === 0) {
    throw new Error('Suspicious payment should trigger anomalies');
  }

  // Test overall fraud risk calculation
  const lowRiskIndicators = {
    rapidBooking: false,
    newAccount: false,
    locationMismatch: false,
    paymentAnomalies: [],
    priceManipulation: false,
    coordinatedAttack: false
  };
  
  const highRiskIndicators = {
    rapidBooking: true,
    newAccount: true,
    locationMismatch: true,
    paymentAnomalies: ['new-high-value-payment', 'unusual-payment-method'],
    priceManipulation: true,
    coordinatedAttack: true
  };
  
  const lowRisk = calculateFraudRisk(lowRiskIndicators);
  const highRisk = calculateFraudRisk(highRiskIndicators);
  
  if (lowRisk > 0.1) {
    throw new Error('Low risk indicators should result in low risk score');
  }
  if (highRisk < 0.8) {
    throw new Error('High risk indicators should result in high risk score');
  }
});

// =====================================================
// MODERATION QUEUE MANAGEMENT LOGIC TESTS
// =====================================================

console.log('🔍 Testing Moderation Queue Management Logic...');
runTest('Moderation Queue Management Logic', () => {
  // Queue prioritization logic
  const calculateQueuePriority = (item) => {
    let priority = 0;
    
    // Base priority by type
    const typePriority = {
      'fraud': 40,
      'content': 30,
      'behavior': 20,
      'appeal': 10
    };
    priority += typePriority[item.type] || 0;
    
    // Urgency multiplier
    const urgencyMultiplier = {
      'urgent': 2,
      'high': 1.5,
      'medium': 1,
      'low': 0.5
    };
    priority *= urgencyMultiplier[item.urgency] || 1;
    
    // Time factor (older items get higher priority)
    const ageHours = (Date.now() - item.createdAt) / (1000 * 60 * 60);
    priority += Math.min(20, ageHours * 0.5);
    
    // Automated score factor
    priority += item.automatedScore * 10;
    
    return Math.round(priority);
  };

  // Queue assignment logic
  const assignModerator = (item, moderators) => {
    // Filter available moderators
    const available = moderators.filter(mod => 
      mod.status === 'available' && 
      mod.specializations.includes(item.type)
    );
    
    if (available.length === 0) return null;
    
    // Find moderator with lowest current workload
    return available.reduce((best, current) => 
      current.currentItems < best.currentItems ? current : best
    );
  };

  // SLA calculation
  const calculateSLA = (item) => {
    const slaHours = {
      'urgent': 1,
      'high': 4,
      'medium': 24,
      'low': 72
    };
    
    const baseHours = slaHours[item.urgency] || 24;
    const createdTime = typeof item.createdAt === 'number' ? item.createdAt : item.createdAt.getTime();
    const deadline = new Date(createdTime + baseHours * 60 * 60 * 1000);
    
    return deadline;
  };

  // Queue health metrics
  const calculateQueueHealth = (queue) => {
    const now = Date.now();
    
    // Count items by age
    const aged = {
      fresh: 0,    // < 1 hour
      aging: 0,    // 1-24 hours
      stale: 0,    // 24-72 hours
      overdue: 0   // > 72 hours
    };
    
    queue.forEach(item => {
      const ageHours = (now - item.createdAt) / (1000 * 60 * 60);
      if (ageHours < 1) aged.fresh++;
      else if (ageHours < 24) aged.aging++;
      else if (ageHours < 72) aged.stale++;
      else aged.overdue++;
    });
    
    // Calculate health score (0-100)
    const total = queue.length;
    if (total === 0) return 100;
    
    const healthScore = Math.max(0, 100 - 
      (aged.stale / total * 30) - 
      (aged.overdue / total * 70)
    );
    
    return {
      score: Math.round(healthScore),
      distribution: aged,
      totalItems: total
    };
  };

  // Test queue management
  const testItems = [
    {
      id: '1',
      type: 'fraud',
      urgency: 'urgent',
      createdAt: Date.now() - 30 * 60 * 1000, // 30 min ago
      automatedScore: 0.9
    },
    {
      id: '2',
      type: 'content',
      urgency: 'medium',
      createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      automatedScore: 0.6
    },
    {
      id: '3',
      type: 'appeal',
      urgency: 'low',
      createdAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      automatedScore: 0.2
    },
    {
      id: '4',
      type: 'behavior',
      urgency: 'high',
      createdAt: Date.now() - 80 * 60 * 60 * 1000, // 80 hours ago (overdue)
      automatedScore: 0.8
    }
  ];

  const testModerators = [
    {
      id: 'mod1',
      status: 'available',
      specializations: ['fraud', 'content'],
      currentItems: 2
    },
    {
      id: 'mod2',
      status: 'available',
      specializations: ['content', 'behavior'],
      currentItems: 5
    },
    {
      id: 'mod3',
      status: 'busy',
      specializations: ['fraud'],
      currentItems: 8
    }
  ];

  // Test priority calculation
  const priorities = testItems.map(item => ({
    id: item.id,
    priority: calculateQueuePriority(item)
  }));

  // Fraud item should have highest priority
  const fraudItem = priorities.find(p => p.id === '1');
  const contentItem = priorities.find(p => p.id === '2');
  const appealItem = priorities.find(p => p.id === '3');

  if (fraudItem.priority <= contentItem.priority) {
    throw new Error('Urgent fraud item should have higher priority than medium content');
  }
  if (appealItem.priority >= contentItem.priority) {
    throw new Error('Old appeal should not have higher priority than medium content');
  }

  // Test moderator assignment
  const fraudAssignment = assignModerator(testItems[0], testModerators);
  const contentAssignment = assignModerator(testItems[1], testModerators);

  if (!fraudAssignment || fraudAssignment.id !== 'mod1') {
    throw new Error('Fraud item should be assigned to moderator with lowest workload');
  }
  if (!contentAssignment) {
    throw new Error('Content item should be assignable');
  }

  // Test SLA calculation
  const urgentSLA = calculateSLA(testItems[0]);
  const mediumSLA = calculateSLA(testItems[1]);

  const urgentHours = (urgentSLA - testItems[0].createdAt) / (1000 * 60 * 60);
  const mediumHours = (mediumSLA - testItems[1].createdAt) / (1000 * 60 * 60);

  if (urgentHours > 1.1) {
    throw new Error('Urgent item SLA should be ~1 hour');
  }
  if (mediumHours > 24.1) {
    throw new Error('Medium item SLA should be ~24 hours');
  }

  // Test queue health
  const queueHealth = calculateQueueHealth(testItems);
  
  if (queueHealth.score > 80) {
    throw new Error('Queue with old items should have lower health score');
  }
  if (queueHealth.distribution.stale === 0) {
    throw new Error('Should detect stale items in queue');
  }
});

// =====================================================
// TEST RESULTS SUMMARY
// =====================================================

console.log('\n============================================================');
console.log('📊 MODERATION & CONTENT ANALYSIS LOGIC TEST RESULTS');
console.log('============================================================');

testResults.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.name}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
});

console.log('\n============================================================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

// Overall Assessment
if (passedTests === totalTests) {
  console.log('\n🏆 OVERALL ASSESSMENT:');
  console.log('✅ EXCELLENT - All moderation & content analysis logic tests passed');
} else if (passedTests / totalTests >= 0.8) {
  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log('⚠️ GOOD - Most moderation system logic tests passed, some issues to address');
} else {
  console.log('\n📋 OVERALL ASSESSMENT:');
  console.log('❌ NEEDS WORK - Significant moderation system logic issues found');
}

console.log(`📋 Test completed at: ${new Date().toISOString()}`);
