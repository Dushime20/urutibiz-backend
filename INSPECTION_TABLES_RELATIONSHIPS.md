# 🔗 Inspection Tables Relationships

## Overview

This document explains the relationships between the inspection-related database tables.

## Table Relationships Diagram

```
┌─────────────────────────┐
│  product_inspections    │ (Parent/Main Table)
│  ─────────────────────  │
│  id (PK)                │
│  product_id (FK)        │──┐
│  booking_id (FK)        │  │
│  inspector_id (FK)      │  │
│  renter_id (FK)         │  │
│  owner_id (FK)          │  │
│  inspection_type        │  │
│  status                 │  │
│  scheduled_at           │  │
│  ...                    │  │
└─────────────────────────┘  │
         │                    │
         │ 1:N                 │
         │                     │
    ┌────┴────┬───────────────┴────┐
    │         │                    │
    │         │                    │
    ▼         ▼                    ▼
┌──────────┐ ┌──────────────┐ ┌──────────────┐
│inspection│ │inspection_  │ │inspection_    │
│_items    │ │photos        │ │disputes       │
│          │ │              │ │               │
│id (PK)   │ │id (PK)       │ │id (PK)        │
│inspection│ │inspection_id │ │inspection_id  │
│_id (FK)  │ │(FK) ─────────┼─┼─► (FK)        │
│item_name │ │item_id (FK)  │ │raised_by (FK) │
│condition │ │photo_url     │ │dispute_type   │
│notes     │ │photo_type    │ │reason         │
│photos    │ │...           │ │status         │
│...       │ │              │ │...           │
└──────────┘ └──────────────┘ └──────────────┘
     │              │
     │              │
     └──────┬───────┘
            │
            │ (Optional 1:N)
            │
            ▼
     inspection_photos
     can also belong to
     a specific item
```

## Detailed Relationships

### 1. **product_inspections** (Parent Table)
- **Primary Key**: `id` (UUID)
- **Purpose**: Main inspection record for a product rental
- **Relationships**:
  - **One-to-Many** with `inspection_items`
  - **One-to-Many** with `inspection_photos`
  - **One-to-Many** with `inspection_disputes`

### 2. **inspection_items** (Child Table)
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `inspection_id` → `product_inspections.id`
- **Relationship Type**: **One-to-Many** (One inspection has many items)
- **Purpose**: Detailed checklist items for an inspection (e.g., "Engine", "Tires", "Interior")
- **Cascade Delete**: ✅ Yes (if inspection is deleted, all items are deleted)
- **Key Fields**:
  - `inspection_id` (FK, NOT NULL)
  - `item_name` (e.g., "Engine", "Tires")
  - `condition` (enum: excellent, good, fair, poor, damaged)
  - `repair_cost`, `replacement_cost`
  - `photos` (JSONB array of photo URLs)
  - `damage_evidence` (JSONB)

### 3. **inspection_photos** (Child Table)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `inspection_id` → `product_inspections.id` (Required)
  - `item_id` → `inspection_items.id` (Optional - photo can belong to a specific item)
- **Relationship Type**: 
  - **Many-to-One** with `product_inspections` (Many photos belong to one inspection)
  - **Many-to-One** with `inspection_items` (Optional - Many photos can belong to one item)
- **Purpose**: Visual evidence/photos for inspections
- **Cascade Delete**: ✅ Yes (if inspection is deleted, all photos are deleted)
- **Key Fields**:
  - `inspection_id` (FK, NOT NULL)
  - `item_id` (FK, NULLABLE - links photo to specific item if applicable)
  - `photo_url` (Cloudinary URL)
  - `photo_type` (enum: general, damage, condition, before, after)
  - `caption`, `metadata`

### 4. **inspection_disputes** (Child Table)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `inspection_id` → `product_inspections.id` (Required)
  - `raised_by` → `users.id` (User who raised the dispute)
  - `resolved_by` → `users.id` (Optional - Inspector/Admin who resolved it)
- **Relationship Type**: **One-to-Many** (One inspection can have many disputes)
- **Purpose**: Dispute records when there's disagreement about inspection results
- **Cascade Delete**: ✅ Yes (if inspection is deleted, all disputes are deleted)
- **Key Fields**:
  - `inspection_id` (FK, NOT NULL)
  - `raised_by` (FK, NOT NULL)
  - `dispute_type` (enum: damage_assessment, condition_disagreement, cost_dispute, other)
  - `reason`, `evidence`
  - `status` (enum: open, under_review, resolved, closed)
  - `resolution_notes`, `agreed_amount`
  - `resolved_by` (FK, NULLABLE)
  - `resolved_at` (timestamp)

## Relationship Summary

| Parent Table | Child Table | Relationship | Foreign Key | Cascade Delete |
|-------------|-------------|--------------|------------|----------------|
| `product_inspections` | `inspection_items` | **1:N** | `inspection_id` | ✅ Yes |
| `product_inspections` | `inspection_photos` | **1:N** | `inspection_id` | ✅ Yes |
| `product_inspections` | `inspection_disputes` | **1:N** | `inspection_id` | ✅ Yes |
| `inspection_items` | `inspection_photos` | **1:N** (Optional) | `item_id` | ✅ Yes |

## Data Flow Example

### Creating an Inspection:

1. **Create** `product_inspections` record (main inspection)
2. **Add** multiple `inspection_items` (each item has `inspection_id` FK)
3. **Upload** `inspection_photos` (each photo has `inspection_id` FK, optionally `item_id` FK)
4. **If dispute occurs**: Create `inspection_disputes` record (has `inspection_id` FK)

### Querying Related Data:

```sql
-- Get inspection with all items, photos, and disputes
SELECT 
  i.*,
  json_agg(DISTINCT it.*) as items,
  json_agg(DISTINCT ip.*) as photos,
  json_agg(DISTINCT id.*) as disputes
FROM product_inspections i
LEFT JOIN inspection_items it ON it.inspection_id = i.id
LEFT JOIN inspection_photos ip ON ip.inspection_id = i.id
LEFT JOIN inspection_disputes id ON id.inspection_id = i.id
WHERE i.id = 'inspection-uuid'
GROUP BY i.id;
```

## Important Notes

1. **Cascade Delete**: All child tables use `ON DELETE CASCADE`, meaning:
   - If a `product_inspections` record is deleted, all related `inspection_items`, `inspection_photos`, and `inspection_disputes` are automatically deleted.

2. **Optional Relationships**:
   - `inspection_photos.item_id` is **optional** - photos can belong to the inspection directly OR to a specific item
   - This allows flexibility: some photos are general inspection photos, others are item-specific

3. **Indexes**: All foreign keys are indexed for performance:
   - `inspection_items.inspection_id` - indexed
   - `inspection_photos.inspection_id` - indexed
   - `inspection_photos.item_id` - indexed
   - `inspection_disputes.inspection_id` - indexed

4. **Data Integrity**:
   - Foreign key constraints ensure data integrity
   - Cannot create an `inspection_item` without a valid `inspection_id`
   - Cannot create an `inspection_photo` without a valid `inspection_id`
   - Cannot create an `inspection_dispute` without a valid `inspection_id`

