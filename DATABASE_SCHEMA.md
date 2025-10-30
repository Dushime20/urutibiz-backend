## UrutiBiz Database Schema (PostgreSQL)

This document summarizes the core database tables, their columns, and relationships as defined by the backend migrations. It focuses on booking, product, payment, pricing, localization, and messaging domains.

### Conventions
- All primary keys are `uuid` unless otherwise noted.
- Timestamps use `created_at`/`updated_at` with `useTz` where present.
- Enums are native PostgreSQL types created via migrations.

---

## Core Commerce

### products
- id (uuid, PK)
- owner_id (uuid, FK → users.id)
- category_id (uuid, FK → categories.id)
- title (string)
- slug (string, unique)
- description (text)
- brand (string)
- model (string)
- serial_number (string)
- year_manufactured (int)
- condition (enum product_condition: new | like_new | good | fair | poor)
- base_price_per_day (decimal)
- base_price_per_week (decimal, nullable)
- base_price_per_month (decimal, nullable)
- security_deposit (decimal, default 0)
- currency (char(3), default RWF)
- location (geometry POINT, SRID 4326)
- address_line (text)
- district (string)
- sector (string)
- pickup_available (boolean, default true)
- delivery_available (boolean, default false)
- delivery_radius_km (int, default 0)
- delivery_fee (decimal, default 0)
- specifications (jsonb)
- features (text[])
- included_accessories (text[])
- status (enum product_status: draft | active | inactive | suspended | deleted, default draft)
- is_featured (boolean, default false)
- view_count (int, default 0)
- tags (varchar(50)[])
- search_vector (tsvector)
- ai_category_confidence (decimal)
- quality_score (decimal)
- created_at, updated_at (timestamp)
- published_at, last_booked_at (timestamp)

Indexes: multiple, incl. owner/category/status/created_at, search.

Relationships:
- products.owner_id → users.id (owner)
- products.category_id → categories.id
- One-to-many with product_images and product_prices.

### product_images
- id (uuid, PK)
- product_id (uuid, FK → products.id, CASCADE)
- image_url (text)
- thumbnail_url (text)
- alt_text (string)
- sort_order (int, default 0)
- is_primary (boolean, default false)
- ai_analysis (jsonb)
- created_at (timestamp)

Relationship: product_images.product_id → products.id

### product_prices
- id (uuid, PK)
- product_id (uuid, FK → products.id, CASCADE)
- country_id (uuid, FK → countries.id, RESTRICT)
- currency (char(3))
- price_per_hour (decimal)
- price_per_day (decimal, NOT NULL)
- price_per_week (decimal)
- price_per_month (decimal)
- security_deposit (decimal, default 0)
- market_adjustment_factor (decimal, default 1.0)
- auto_convert (boolean, default true)
- base_price (decimal)
- base_currency (char(3))
- exchange_rate (decimal)
- exchange_rate_updated_at (timestamp)
- min_rental_duration_hours (decimal, default 1)
- max_rental_duration_days (decimal)
- early_return_fee_percentage (decimal, default 0, 0..1)
- late_return_fee_per_hour (decimal, default 0)
- weekly_discount_percentage (decimal, 0..1)
- monthly_discount_percentage (decimal, 0..1)
- bulk_discount_threshold (numeric, default 1)
- bulk_discount_percentage (decimal, 0..1)
- dynamic_pricing_enabled (bool, default false)
- peak_season_multiplier (decimal, default 1.0)
- off_season_multiplier (decimal, default 1.0)
- seasonal_adjustments (jsonb)
- is_active (boolean, default true)
- effective_from (timestamp, default now)
- effective_until (timestamp)
- notes (text)
- created_at, updated_at (timestamp)

Constraints/Indexes: multiple; unique (product_id, country_id, currency); several CHECKs for positivity/ranges.

Relationship: Many prices per product by country/currency.

### categories
- id (uuid, PK)
- name (string)
- slug (string, unique)
- description (text)
- parent_id (uuid, FK → categories.id, nullable)
- image_url (text)
- icon_name (string)
- sort_order (int, default 0)
- is_active (boolean, default true)
- created_at (timestamp)

Relationship: self-referential parent-child; products link to categories.

---

## Booking Domain

### bookings
- id (uuid, PK)
- renter_id (uuid, FK → users.id, CASCADE)
- owner_id (uuid, FK → users.id, CASCADE)
- product_id (uuid, FK → products.id, CASCADE)
- booking_number (string, unique)
- status (enum booking_status: pending | confirmed | in_progress | completed | cancelled | disputed, default pending)
- payment_status (enum payment_status)
- insurance_type (enum insurance_type: basic | standard | premium | none, default none)
- start_date, end_date (timestamp, tz)
- check_in_time, check_out_time (timestamp, tz)
- pickup_method (string, default pickup)
- pickup_address, delivery_address (text)
- pickup_coordinates, delivery_coordinates (jsonb)
- insurance_policy_number (string)
- insurance_premium (decimal)
- insurance_details (jsonb)
- pricing (jsonb, NOT NULL) — normalized pricing breakdown used by the app
- total_amount (decimal, NOT NULL)
- security_deposit (decimal)
- platform_fee (decimal)
- tax_amount (decimal)
- ai_risk_score (decimal)
- ai_assessment (jsonb)
- special_instructions, renter_notes, owner_notes, admin_notes (text)
- initial_condition, final_condition (string)
- damage_report (text)
- damage_photos (jsonb)
- created_by, last_modified_by (uuid → users.id)
- created_at, updated_at (timestamp)
- metadata (jsonb)
- is_repeat_booking (boolean, default false)
- parent_booking_id (uuid → bookings.id)

Indexes: renter/status, owner/status, product/dates, booking_number, status/payment_status, created_at.

Relationships:
- bookings.renter_id/owner_id → users
- bookings.product_id → products
- parent_booking_id self-ref for rebookings
- payment_transactions.booking_id (optional link)
- booking_status_history.booking_id (audit)

### booking_status_history
- id (uuid, PK)
- booking_id (uuid, FK → bookings.id, CASCADE)
- previous_status (string)
- new_status (string, NOT NULL)
- changed_by (uuid, FK → users.id)
- reason (text)
- metadata (jsonb)
- changed_at (timestamp)

Indexes: booking_id/changed_at, changed_by, new_status.

---

## Payments

### payment_transactions
- id (uuid, PK)
- booking_id (uuid, nullable, FK later)
- user_id (uuid, FK → users.id)
- payment_method_id (uuid, FK → payment_methods.id)
- transaction_type (enum: booking_payment | security_deposit | refund | partial_refund | platform_fee | insurance_payment | delivery_fee)
- amount (decimal, NOT NULL)
- currency (char(3), default RWF)
- provider (string)
- provider_transaction_id (string, unique per provider)
- provider_fee (decimal, default 0)
- status (payment_status enum, default pending)
- processed_at, expires_at (timestamp)
- original_currency (char(3))
- original_amount (decimal)
- exchange_rate (decimal)
- exchange_rate_date (date)
- metadata (jsonb)
- failure_reason (text)
- provider_response (text)
- created_at, updated_at (timestamp)
- created_by, updated_by (string)

Indexes/Constraints: multiple; provider/provider_transaction_id unique; various CHECK constraints.

Relationships:
- Optional link to bookings
- payment_method and user references.

### payment_methods
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- type (enum: card | mobile_money | bank_transfer)
- provider (enum: stripe | mtn_momo | airtel_money | visa | mastercard | paypal | bank)
- last_four (string)
- card_brand (enum: visa | mastercard | amex | …)
- exp_month, exp_year (int)
- phone_number (string)
- provider_token (text)
- payment_provider_id (uuid, FK → payment_providers.id)
- is_default (boolean, default false)
- is_verified (boolean, default false)
- currency (char(3), default RWF)
- created_at, updated_at (timestamp)
- metadata (jsonb)

Indexes/Constraints: multiple; partial unique index ensuring only one default per user; validation CHECK constraints for card/mobile money details.

### payment_providers
- id (uuid, PK)
- country_id (uuid, FK → countries.id)
- provider_name (string)
- provider_type (string)
- display_name (string)
- logo_url (text)
- is_active (boolean)
- supported_currencies (varchar(3)[])
- min_amount, max_amount (decimal)
- fee_percentage (decimal)
- fee_fixed (decimal)
- settings (jsonb)
- description (text)
- api_endpoint (string)
- supports_refunds (boolean)
- supports_recurring (boolean)
- processing_time_minutes (int)
- created_at, updated_at (timestamp)

Indexes/Constraints: multiple; unique(country_id, provider_name).

---

## Localization / Countries

### countries
- id (uuid, PK)
- code (char(2), unique)
- code_alpha3 (char(3), unique)
- name (string)
- local_name (string)
- currency_code (char(3))
- currency_symbol (string)
- phone_prefix (string)
- timezone (string)
- languages (varchar(10)[])
- is_active (boolean, default true)
- launch_date (date)
- created_at, updated_at (timestamp)

Relationships: referenced by payment_providers and product_prices.

---

## Messaging & Notifications (subset)

### chats
- id (uuid, PK)
- participant_ids (jsonb, list of user uuids)
- is_active (boolean)
- metadata (jsonb)
- created_at, updated_at (timestamps)

### messages
- id (uuid, PK)
- chat_id (uuid, FK → chats.id, CASCADE)
- sender_id (uuid)
- content (text)
- message_type (enum: text | image | file | system)
- is_read (boolean)
- metadata (jsonb)
- created_at, updated_at (timestamps)

### message_templates
- id (uuid, PK)
- name (string)
- content (text)
- category (string)
- is_active (boolean)
- created_at, updated_at (timestamps)

### system_notifications
- id (uuid, PK)
- title (string)
- message (text)
- type (enum: info | warning | error | success)
- is_read (boolean)
- read_at (timestamp)
- metadata (jsonb)
- created_at, updated_at (timestamps)

### email_templates
- id (uuid, PK)
- name (string)
- subject (string)
- html_content (text)
- text_content (text)
- variables (jsonb)
- is_active (boolean)
- created_at, updated_at (timestamps)

### scheduled_notifications
- id (uuid, PK)
- title (string)
- message (text)
- notification_type (enum: push | email | sms)
- target_users (jsonb)
- scheduled_at (timestamp)
- sent_at (timestamp)
- status (enum: pending | sent | failed | cancelled)
- metadata (jsonb)
- created_at, updated_at (timestamps)

### push_notifications
- id (uuid, PK)
- title (string)
- body (text)
- user_ids (jsonb)
- data (jsonb)
- scheduled_at, sent_at (timestamp)
- status (enum: pending | sent | failed)
- created_at, updated_at (timestamps)

---

## Relationships Overview
- users 1—n products (owner_id)
- categories 1—n products (category_id); categories self 1—n categories (parent_id)
- products 1—n product_images
- products 1—n product_prices; product_prices n—1 countries
- users 1—n bookings (as renter and owner via separate FKs)
- products 1—n bookings
- bookings 1—n booking_status_history
- users 1—n payment_methods; payment_methods n—1 payment_providers; payment_providers n—1 countries
- users/bookings/payment_methods 1—n payment_transactions
- messaging: chats 1—n messages

---

## Additional Domains (Complete Table Inventory)

Below is the full table inventory from migrations, with key columns and relationships. Some auxiliary indexes/checks omitted for brevity.

### users
- id (uuid, PK), first_name, last_name, email, password_hash, role, status, created_at, updated_at
- Relationships: users referenced by many tables (bookings.renter_id/owner_id, payment_methods.user_id, etc.)

### email_verification_tokens
- id (uuid, PK), user_id (uuid → users), token, expires_at, created_at

### password_reset_tokens
- id (uuid, PK), user_id (uuid → users), token, expires_at, created_at

### user_sessions
- id (uuid, PK), user_id (uuid → users), session_token, refresh_token, ip_address, user_agent, expires_at, created_at

### user_verifications
- id (uuid, PK), user_id (uuid → users), verification_type, verification_status, data(jsonb), created_at, updated_at

### email_verification_otps
- id (uuid, PK), user_id (uuid → users), email, otp_code, verified(bool), expires_at, created_at

### phone_verification_otps
- id (uuid, PK), user_id (uuid → users), phone_number, otp_code, verified(bool), expires_at, created_at

### verification_document_types
- id (uuid, PK), name, description, required_fields(jsonb), is_active(bool), created_at

### products
(Documented above in Core Commerce.)

### product_images
(Documented above in Core Commerce.)

### product_availability
- id (uuid, PK), product_id (uuid → products), availability_type, start_date, end_date, is_available, created_at

### product_views
- id (uuid, PK), product_id (uuid → products), user_id (uuid → users), created_at

### product_reviews
- id (uuid, PK), product_id (uuid → products), user_id (uuid → users), rating, comment, created_at

### reviews
(Detailed review system documented in migration — see columns in file. Key: id, booking_id → bookings, reviewer_id → users, reviewed_user_id → users, multiple rating fields, moderation fields, metadata, created_at, updated_at.)

### audit_logs
- id (uuid, PK), user_id (uuid → users), action, details(jsonb), created_at

### documents
- id (uuid, PK), user_id (uuid → users), document_type, url, metadata(jsonb), created_at

### categories
(Documented above in Core Commerce.)

### category_regulations
- id (uuid, PK), category_id (uuid → categories), country_id (uuid → countries), is_allowed, requires_license, license_type, min_age_requirement, max_rental_days, special_requirements, mandatory_insurance, min_coverage_amount, max_liability_amount, requires_background_check, prohibited_activities, seasonal_restrictions(jsonb), documentation_required(jsonb), compliance_level(enum), created_at, updated_at, deleted_at

### administrative_divisions
- id (uuid, PK), country_id (uuid → countries), parent_id (uuid → administrative_divisions), level, code, name, local_name, type, population, area_km2, coordinates(geometry), bounds(geometry), is_active, created_at, updated_at

### countries
(Documented above in Localization.)

### exchange_rates
- id (uuid, PK), base_currency, counter_currency, rate, rate_date, created_at

### translations
- id (uuid, PK), locale, key, value, namespace, created_at, updated_at

### tax_rates
- id (uuid, PK), country_id (uuid → countries), category_id (uuid → categories), rate, effective_from, effective_until, created_at

### delivery_providers
- id (uuid, PK), name, country_id (uuid → countries), is_active, settings(jsonb), created_at, updated_at

### localization_and_business
- id (uuid, PK), key, value, created_at

### bookings
(Documented above in Booking Domain.)

### booking_status_history
(Documented above in Booking Domain.)

### product_prices
(Documented above in Core Commerce.)

### payment_methods
(Documented above in Payments.)

### payment_providers
(Documented above in Payments.)

### payment_transactions
(Documented above in Payments.)

### insurance_providers
- id (uuid, PK), name, country_id (uuid → countries), is_active, contact_info(jsonb), settings(jsonb), created_at

### insurance_policies
- id (uuid, PK), booking_id (uuid → bookings), policy_number, insurance_type(enum), coverage_amount, premium_amount, deductible_amount, coverage_details(jsonb), terms_and_conditions, status, provider_name, provider_policy_id, valid_from, valid_until, created_at

### insurance_claims
- id (uuid, PK), policy_id (uuid → insurance_policies), booking_id (uuid → bookings), claimant_id (uuid → users), claim_number, incident_date, claim_amount, approved_amount, incident_description, damage_photos(text[]), status, processed_by (uuid → users), processing_notes, ai_fraud_score, ai_damage_assessment(jsonb), created_at, resolved_at

### violations
- id (uuid, PK), booking_id (uuid → bookings), product_id (uuid → products), renter_id (uuid → users), violation_type, severity, description, status, penalty_amount, created_at, updated_at

### violation_evidence
- id (uuid, PK), violation_id (uuid → violations), type, url, description, uploaded_by, uploaded_at

### violation_comments
- id (uuid, PK), violation_id (uuid → violations), comment, author_id, created_at

### moderation_actions
- id (uuid, PK), target_type, target_id, action, reason, metadata(jsonb), created_at

### system_settings
- id (uuid, PK), key (unique), value, description, created_at, updated_at

### product_inspections
- id (uuid, PK), product_id (uuid → products), inspector_id (uuid → users), inspection_date, status, notes, created_at

### inspection_items
- id (uuid, PK), inspection_id (uuid → product_inspections), item_name, description, condition, notes, repair_cost, replacement_cost

### inspection_photos
- id (uuid, PK), inspection_id (uuid → product_inspections), url, description, uploaded_by, uploaded_at

### inspection_disputes
- id (uuid, PK), inspection_id (uuid → product_inspections), raised_by, notes, status, created_at

### user_favorites
- id (uuid, PK), user_id (uuid → users), product_id (uuid → products), created_at

### ai_recommendations
- id (int, PK), user_id (int), recommendation(text), created_at

### ai_recommendations (newer UUID variant)
- id (uuid/int depending on migration), user_id, recommendation, created_at (note: there are two migrations creating similar tables; keep one authoritative in production)

### communication
- id (uuid, PK), from_user_id, to_user_id, subject, body, metadata(jsonb), created_at

### notification_templates
- id (uuid, PK), name, channel, subject, body, variables(jsonb), is_active, created_at

### notifications
- id (uuid, PK), user_id (uuid → users), template_id (uuid → notification_templates), channel, payload(jsonb), status, sent_at, created_at

### notification_delivery_attempts
- id (uuid, PK), notification_id (uuid → notifications), attempt_no, status, response(text), created_at

### notification_delivery_status
- id (uuid, PK), notification_id (uuid → notifications), status, delivered_at, read_at

### user_notification_preferences
- id (uuid, PK), user_id (uuid → users), preferences(jsonb), created_at

### user_devices
- id (uuid, PK), user_id (uuid → users), device_token, platform, metadata(jsonb), created_at

### chats
- id (uuid, PK), participant_ids(jsonb), is_active, metadata(jsonb), created_at, updated_at

### messages
- id (uuid, PK), chat_id (uuid → chats), sender_id (uuid → users), content, message_type, is_read, metadata(jsonb), created_at, updated_at

### message_templates
- id (uuid, PK), name, content, category, is_active, created_at, updated_at

### system_notifications
- id (uuid, PK), title, message, type, is_read, read_at, metadata(jsonb), created_at, updated_at

### email_templates
- id (uuid, PK), name, subject, html_content, text_content, variables(jsonb), is_active, created_at, updated_at

### scheduled_notifications
- id (uuid, PK), title, message, notification_type, target_users(jsonb), scheduled_at, sent_at, status, metadata(jsonb), created_at, updated_at

### push_notifications
- id (uuid, PK), title, body, user_ids(jsonb), data(jsonb), scheduled_at, sent_at, status, created_at, updated_at

### risk management tables
- product_risk_profiles: id, product_id → products, category_id → categories, risk_level, requirements/mitigation fields, enforcement fields, created_at, updated_at
- risk_assessments: id, product_id → products, renter_id → users, booking_id → bookings, multiple risk scores, factors/recommendations, compliance_status, assessment_date, expires_at, created_at, updated_at
- compliance_checks: id, booking_id → bookings, product_id → products, renter_id → users, is_compliant, missing_requirements, compliance_score, status, grace_period_ends_at, enforcement_actions, last_checked_at, created_at, updated_at
- policy_violations: id, booking_id → bookings, product_id → products, renter_id → users, violation_type, severity, description, detected_at, resolved_at, resolution_actions, penalty_amount, status, created_at, updated_at
- enforcement_actions: id, booking_id → bookings, product_id → products, renter_id → users, action_type, severity, message, required_action, deadline, executed_at, status, execution_notes, created_at, updated_at
- risk_management_configs: id, category_id → categories, country_id → countries, thresholds, enforcement/insurance/inspection settings, compliance tracking, notification_settings, is_active, created_at, updated_at

### handover/return tables
- handover_sessions: id, booking_id → bookings, owner_id → users, renter_id → users, product_id → products, handover_type, scheduled_date_time, actual_date_time, location fields, status, handover_code, documentation/verification fields, notes, durations, created_at, updated_at, completed_at
- return_sessions: id, booking_id → bookings, handover_session_id → handover_sessions, owner_id → users, renter_id → users, product_id → products, return_type, scheduled/actual date_time, location, status, return_code, documentation, assessments, verification, notes, durations, created_at, updated_at, completed_at
- handover_messages: id, handover_session_id → handover_sessions, sender_id → users, sender_type, message, message_type, attachments(json), timestamp, read_by(json)
- return_messages: id, return_session_id → return_sessions, sender_id → users, sender_type, message, message_type, attachments(json), timestamp, read_by(json)
- handover_notifications: id, user_id → users, handover_session_id → handover_sessions, type, channel, message, priority, scheduled_at, sent_at, read_at, status, metadata(json)
- return_notifications: id, user_id → users, return_session_id → return_sessions, type, channel, message, priority, scheduled_at, sent_at, read_at, status, metadata(json)
- handover_return_stats: id, date, total_handovers, total_returns, completed_handovers, completed_returns, cancelled_handovers, cancelled_returns, disputed_handovers, disputed_returns, average_handover_time_minutes, average_return_time_minutes, handover_success_rate, return_on_time_rate, user_satisfaction_score, created_at, updated_at
- handover_return_settings: id, setting_key(unique), setting_value, description, is_active, created_at, updated_at

---

## Final Notes
- This inventory aggregates all createTable migrations and core column sets. When in doubt, consult the specific migration file for the authoritative schema details, constraints, and indexes.

## Notes and Gaps
- The `bookings` table normalizes the pricing breakdown as a JSONB object (`pricing`), with select denormalized totals (`total_amount`, `platform_fee`, `tax_amount`). There is no `bookings.service_fee` column; analytics should not reference it.
- Several migrations add/alter columns across time (e.g., pickup_time, features, base_amount). The current summary reflects the comprehensive set.
- Additional domains exist (insurance, reviews, risk management, admin, localization), each with their own migrations not fully reproduced here. Extend this README similarly if you need those details.


