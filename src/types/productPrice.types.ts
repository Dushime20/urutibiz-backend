// =====================================================
// PRODUCT PRICE INTERFACES
// =====================================================

/**
 * Base product price interface
 */
export interface ProductPrice {
  id: string;
  product_id: string;
  country_id: string;
  currency: string;
  
  // Pricing tiers
  price_per_hour?: number;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  security_deposit: number;
  
  // Market-specific adjustments
  market_adjustment_factor: number;
  auto_convert: boolean;
  base_price?: number;
  base_currency?: string;
  exchange_rate?: number;
  exchange_rate_updated_at?: Date;
  
  // Pricing rules and duration limits
  min_rental_duration_hours: number;
  max_rental_duration_days?: number;
  early_return_fee_percentage: number;
  late_return_fee_per_hour: number;
  
  // Discount settings
  weekly_discount_percentage: number;
  monthly_discount_percentage: number;
  bulk_discount_threshold: number;
  bulk_discount_percentage: number;
  
  // Seasonal and dynamic pricing
  dynamic_pricing_enabled: boolean;
  peak_season_multiplier: number;
  off_season_multiplier: number;
  seasonal_adjustments?: Record<string, number>;
  
  // Availability and status
  is_active: boolean;
  effective_from: Date;
  effective_until?: Date;
  notes?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * Create product price request interface
 */
export interface CreateProductPriceRequest {
  product_id: string;
  country_id: string;
  currency: string;
  
  // Pricing tiers (at least daily price required)
  price_per_hour?: number;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  security_deposit?: number;
  
  // Market adjustments
  market_adjustment_factor?: number;
  auto_convert?: boolean;
  base_price?: number;
  base_currency?: string;
  exchange_rate?: number;
  
  // Rental rules
  min_rental_duration_hours?: number;
  max_rental_duration_days?: number;
  early_return_fee_percentage?: number;
  late_return_fee_per_hour?: number;
  
  // Discounts
  weekly_discount_percentage?: number;
  monthly_discount_percentage?: number;
  bulk_discount_threshold?: number;
  bulk_discount_percentage?: number;
  
  // Dynamic pricing
  dynamic_pricing_enabled?: boolean;
  peak_season_multiplier?: number;
  off_season_multiplier?: number;
  seasonal_adjustments?: Record<string, number>;
  
  // Status
  is_active?: boolean;
  effective_from?: Date;
  effective_until?: Date;
  notes?: string;
}

/**
 * Update product price request interface
 */
export interface UpdateProductPriceRequest {
  // Pricing tiers
  price_per_hour?: number;
  price_per_day?: number;
  price_per_week?: number;
  price_per_month?: number;
  security_deposit?: number;
  
  // Market adjustments
  market_adjustment_factor?: number;
  auto_convert?: boolean;
  base_price?: number;
  base_currency?: string;
  exchange_rate?: number;
  
  // Rental rules
  min_rental_duration_hours?: number;
  max_rental_duration_days?: number;
  early_return_fee_percentage?: number;
  late_return_fee_per_hour?: number;
  
  // Discounts
  weekly_discount_percentage?: number;
  monthly_discount_percentage?: number;
  bulk_discount_threshold?: number;
  bulk_discount_percentage?: number;
  
  // Dynamic pricing
  dynamic_pricing_enabled?: boolean;
  peak_season_multiplier?: number;
  off_season_multiplier?: number;
  seasonal_adjustments?: Record<string, number>;
  
  // Status
  is_active?: boolean;
  effective_from?: Date;
  effective_until?: Date;
  notes?: string;
}

/**
 * Product price filters interface
 */
export interface ProductPriceFilters {
  product_id?: string;
  country_id?: string;
  currency?: string;
  is_active?: boolean;
  auto_convert?: boolean;
  dynamic_pricing_enabled?: boolean;
  min_price?: number;
  max_price?: number;
  has_hourly_pricing?: boolean;
  has_weekly_pricing?: boolean;
  has_monthly_pricing?: boolean;
  effective_on?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'price_per_day' | 'price_per_hour' | 'currency' | 'effective_from' | 'country_id' | 'product_id';
  sort_order?: 'asc' | 'desc';
}

/**
 * Price calculation request interface
 */
export interface PriceCalculationRequest {
  product_id: string;
  country_id: string;
  currency?: string;
  rental_duration_hours: number;
  quantity?: number;
  rental_start_date?: Date;
  include_security_deposit?: boolean;
  apply_discounts?: boolean;
}

/**
 * Price calculation result interface
 */
export interface PriceCalculationResult {
  product_id: string;
  country_id: string;
  currency: string;
  
  // Duration breakdown
  rental_duration_hours: number;
  rental_duration_days: number;
  quantity: number;
  
  // Base pricing
  base_rate_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  base_rate: number;
  base_amount: number;
  
  // Adjustments and fees
  market_adjustment_factor: number;
  seasonal_multiplier: number;
  peak_season_adjustment: number;
  
  // Discounts applied
  weekly_discount: number;
  monthly_discount: number;
  bulk_discount: number;
  total_discount: number;
  
  // Final calculation
  subtotal: number;
  security_deposit: number;
  total_amount: number;
  
  // Additional fees
  early_return_fee?: number;
  late_return_fee?: number;
  
  // Metadata
  calculation_date: Date;
  exchange_rate_used?: number;
  pricing_tier_used: string;
  discounts_applied: string[];
  notes: string[];
}

/**
 * Bulk price update operation interface
 */
export interface BulkPriceUpdateOperation {
  operation: 'update_prices' | 'update_discounts' | 'update_market_factors' | 'activate' | 'deactivate' | 'update_exchange_rates';
  product_ids?: string[];
  country_ids?: string[];
  currencies?: string[];
  filters?: Partial<ProductPriceFilters>;
  data: {
    // Price updates
    price_adjustment_percentage?: number;
    market_adjustment_factor?: number;
    
    // Discount updates
    weekly_discount_percentage?: number;
    monthly_discount_percentage?: number;
    bulk_discount_percentage?: number;
    
    // Exchange rate updates
    exchange_rate?: number;
    base_currency?: string;
    
    // Status updates
    is_active?: boolean;
    effective_from?: Date;
    effective_until?: Date;
  };
}

/**
 * Price comparison interface
 */
export interface PriceComparison {
  product_id: string;
  comparison_date: Date;
  base_duration_hours: number;
  quantity: number;
  
  country_prices: Array<{
    country_id: string;
    country_name: string;
    currency: string;
    price_calculation: PriceCalculationResult;
    rank_by_total: number;
    rank_by_daily_rate: number;
  }>;
  
  cheapest_country: {
    country_id: string;
    total_amount: number;
    currency: string;
    savings_percentage: number;
  };
  
  most_expensive_country: {
    country_id: string;
    total_amount: number;
    currency: string;
    premium_percentage: number;
  };
  
  average_price: number;
  price_variance: number;
  currency_diversity: string[];
}

/**
 * Market analysis interface
 */
export interface MarketAnalysis {
  analysis_date: Date;
  product_id?: string;
  country_id?: string;
  
  pricing_overview: {
    total_price_records: number;
    active_price_records: number;
    countries_covered: number;
    currencies_supported: string[];
    average_daily_rate: number;
    median_daily_rate: number;
    price_range: {
      min: number;
      max: number;
      currency: string;
    };
  };
  
  market_factors: {
    average_market_adjustment: number;
    countries_with_premium: number;
    countries_with_discount: number;
    dynamic_pricing_adoption: number;
  };
  
  discount_analysis: {
    average_weekly_discount: number;
    average_monthly_discount: number;
    average_bulk_discount: number;
    most_generous_country: string;
    most_restrictive_country: string;
  };
  
  seasonal_trends: {
    peak_season_countries: number;
    average_peak_multiplier: number;
    seasonal_variance: number;
    most_seasonal_country: string;
  };
  
  currency_distribution: Record<string, {
    count: number;
    percentage: number;
    average_rate: number;
  }>;
  
  recommendations: string[];
}

/**
 * Price history interface
 */
export interface PriceHistory {
  product_id: string;
  country_id: string;
  currency: string;
  
  history: Array<{
    price_id: string;
    effective_from: Date;
    effective_until?: Date;
    price_per_day: number;
    market_adjustment_factor: number;
    change_reason?: string;
    created_by?: string;
  }>;
  
  statistics: {
    total_changes: number;
    average_duration_days: number;
    highest_price: number;
    lowest_price: number;
    current_price: number;
    price_trend: 'increasing' | 'decreasing' | 'stable';
    volatility_score: number;
  };
}

/**
 * Exchange rate update interface
 */
export interface ExchangeRateUpdate {
  base_currency: string;
  target_currency: string;
  exchange_rate: number;
  rate_source: string;
  update_timestamp: Date;
  confidence_score?: number;
  bid_rate?: number;
  ask_rate?: number;
  previous_rate?: number;
  change_percentage?: number;
}

/**
 * Pricing strategy interface
 */
export interface PricingStrategy {
  strategy_id: string;
  strategy_name: string;
  description: string;
  
  target_markets: string[];
  product_categories: string[];
  
  base_pricing: {
    calculation_method: 'cost_plus' | 'market_based' | 'value_based' | 'competitive';
    margin_percentage: number;
    minimum_margin: number;
  };
  
  market_adjustments: {
    enable_geo_pricing: boolean;
    purchasing_power_factor: number;
    competition_factor: number;
    demand_factor: number;
  };
  
  discount_policies: {
    max_weekly_discount: number;
    max_monthly_discount: number;
    max_bulk_discount: number;
    loyalty_discount: number;
  };
  
  dynamic_pricing: {
    enabled: boolean;
    demand_sensitivity: number;
    competitor_price_monitoring: boolean;
    seasonal_adjustment_auto: boolean;
    max_price_change_per_update: number;
  };
  
  effectiveness_metrics: {
    conversion_rate: number;
    average_booking_value: number;
    profit_margin: number;
    market_share: number;
    customer_satisfaction: number;
  };
}

/**
 * Price optimization suggestion interface
 */
export interface PriceOptimizationSuggestion {
  product_id: string;
  country_id: string;
  current_price: number;
  suggested_price: number;
  confidence_level: number;
  
  optimization_type: 'increase_revenue' | 'increase_bookings' | 'competitive_match' | 'market_penetration';
  
  reasoning: {
    market_analysis: string;
    competition_analysis: string;
    demand_analysis: string;
    profitability_impact: string;
  };
  
  expected_impact: {
    booking_volume_change: number;
    revenue_change: number;
    profit_change: number;
    market_position_change: string;
  };
  
  implementation: {
    recommended_start_date: Date;
    test_duration_days: number;
    success_metrics: string[];
    rollback_conditions: string[];
  };
  
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high';
    potential_downsides: string[];
    mitigation_strategies: string[];
  };
}

/**
 * Product price statistics interface
 */
export interface ProductPriceStats {
  total_price_records: number;
  active_price_records: number;
  inactive_price_records: number;
  countries_with_pricing: number;
  currencies_supported: number;
  
  pricing_coverage: {
    products_with_pricing: number;
    products_without_pricing: number;
    coverage_percentage: number;
  };
  
  price_distribution: {
    by_currency: Record<string, number>;
    by_country: Record<string, number>;
    by_price_range: Record<string, number>;
  };
  
  discount_analysis: {
    products_with_weekly_discount: number;
    products_with_monthly_discount: number;
    products_with_bulk_discount: number;
    average_weekly_discount: number;
    average_monthly_discount: number;
    average_bulk_discount: number;
  };
  
  market_analysis: {
    average_market_adjustment: number;
    countries_with_premium_pricing: number;
    countries_with_discount_pricing: number;
    auto_convert_adoption: number;
    dynamic_pricing_adoption: number;
  };
  
  temporal_analysis: {
    recent_price_updates: number;
    upcoming_price_changes: number;
    expired_pricing: number;
    average_pricing_duration_days: number;
  };
}

/**
 * Revenue projection interface
 */
export interface RevenueProjection {
  projection_id: string;
  product_id: string;
  country_id: string;
  projection_period: {
    start_date: Date;
    end_date: Date;
    period_type: 'monthly' | 'quarterly' | 'yearly';
  };
  
  assumptions: {
    average_booking_duration_hours: number;
    bookings_per_month: number;
    seasonal_variation: Record<string, number>;
    growth_rate: number;
    market_penetration: number;
  };
  
  revenue_breakdown: {
    base_rental_revenue: number;
    security_deposit_interest: number;
    late_fee_revenue: number;
    early_return_fee_revenue: number;
    total_projected_revenue: number;
  };
  
  scenario_analysis: {
    conservative: {
      revenue: number;
      probability: number;
    };
    expected: {
      revenue: number;
      probability: number;
    };
    optimistic: {
      revenue: number;
      probability: number;
    };
  };
  
  confidence_metrics: {
    data_quality_score: number;
    market_stability_score: number;
    historical_accuracy: number;
    overall_confidence: number;
  };
}
