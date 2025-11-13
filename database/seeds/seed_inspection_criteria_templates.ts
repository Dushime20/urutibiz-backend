import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Check if templates already exist
  const existing = await knex('inspection_criteria_templates').first();
  if (existing) {
    console.log('Inspection criteria templates already seeded');
    return;
  }

  // Get category IDs (you may need to adjust these based on your actual categories)
  const categories = await knex('categories').select('id', 'name', 'title');
  
  // Find or create category mappings
  const getCategoryId = (name: string) => {
    const cat = categories.find(c => 
      (c.name || '').toLowerCase().includes(name.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(name.toLowerCase())
    );
    return cat?.id || null;
  };

  // =====================================================
  // CARS/VEHICLES TEMPLATES (Dubizzle's QualityAssist Model)
  // =====================================================
  const carCategoryId = getCategoryId('car') || getCategoryId('vehicle') || getCategoryId('auto');
  if (carCategoryId) {
    // STANDARD INSPECTION (120 points) - Dubizzle's Standard Inspection
    await knex('inspection_criteria_templates').insert({
      id: require('uuid').v4(),
      category_id: carCategoryId,
      category_name: 'Cars/Vehicles',
      template_name: 'Standard Vehicle Inspection (120-Point)',
      description: 'Dubizzle QualityAssist Standard Inspection: 120-point comprehensive check covering mechanical, electrical, paint, underbody, interior, and documentation',
      inspection_tier: 'standard',
      criteria: JSON.stringify([
        {
          id: 'mechanical_engine',
          name: 'Mechanical - Engine',
          description: 'Engine performance, condition, oil level, leaks, unusual sounds, transmission, drivetrain',
          maxPoints: 30,
          category: 'Mechanical',
          required: true
        },
        {
          id: 'electrical_systems',
          name: 'Electrical Systems',
          description: 'Battery and charging system, lights and indicators, electronics and infotainment, all electrical components',
          maxPoints: 25,
          category: 'Electrical',
          required: true
        },
        {
          id: 'paint_body',
          name: 'Paint and Body',
          description: 'Exterior paint condition, body panels and structure, rust and corrosion, panel alignment',
          maxPoints: 25,
          category: 'Paint & Body',
          required: true
        },
        {
          id: 'underbody',
          name: 'Underbody Condition',
          description: 'Chassis and frame, suspension components, undercarriage damage, structural integrity',
          maxPoints: 20,
          category: 'Underbody',
          required: true
        },
        {
          id: 'interior',
          name: 'Interior Condition',
          description: 'Upholstery and trim, dashboard and controls, overall cleanliness, odors',
          maxPoints: 10,
          category: 'Interior',
          required: true
        },
        {
          id: 'documentation',
          name: 'Documentation',
          description: 'Service history, registration and ownership documents, insurance papers',
          maxPoints: 10,
          category: 'Documentation',
          required: false
        }
      ]),
      total_points: 120,
      is_active: true,
      is_global: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ADVANCED INSPECTION (240 points) - Dubizzle's Advanced Inspection
    await knex('inspection_criteria_templates').insert({
      id: require('uuid').v4(),
      category_id: carCategoryId,
      category_name: 'Cars/Vehicles',
      template_name: 'Advanced Vehicle Inspection (240-Point)',
      description: 'Dubizzle QualityAssist Advanced Inspection: 240-point detailed assessment with extended checks, additional diagnostic tests, and component-by-component evaluation',
      inspection_tier: 'advanced',
      criteria: JSON.stringify([
        // Extended Mechanical (60 points)
        {
          id: 'mechanical_engine_advanced',
          name: 'Mechanical - Engine (Advanced)',
          description: 'Detailed engine analysis, compression tests, timing belt, cooling system, exhaust system, transmission detailed check',
          maxPoints: 60,
          category: 'Mechanical',
          required: true,
          subCriteria: [
            { id: 'engine_performance', name: 'Engine Performance', maxPoints: 20 },
            { id: 'transmission', name: 'Transmission & Drivetrain', maxPoints: 15 },
            { id: 'cooling_system', name: 'Cooling System', maxPoints: 10 },
            { id: 'exhaust_system', name: 'Exhaust System', maxPoints: 10 },
            { id: 'diagnostic_tests', name: 'Diagnostic Tests', maxPoints: 5 }
          ]
        },
        // Extended Electrical (50 points)
        {
          id: 'electrical_systems_advanced',
          name: 'Electrical Systems (Advanced)',
          description: 'Comprehensive electrical check, battery health, charging system, all lights, sensors, infotainment, computer diagnostics',
          maxPoints: 50,
          category: 'Electrical',
          required: true,
          subCriteria: [
            { id: 'battery_charging', name: 'Battery & Charging', maxPoints: 15 },
            { id: 'lights_indicators', name: 'Lights & Indicators', maxPoints: 10 },
            { id: 'electronics_infotainment', name: 'Electronics & Infotainment', maxPoints: 15 },
            { id: 'sensors_computer', name: 'Sensors & Computer Diagnostics', maxPoints: 10 }
          ]
        },
        // Extended Paint & Body (50 points)
        {
          id: 'paint_body_advanced',
          name: 'Paint and Body (Advanced)',
          description: 'Detailed paint analysis, body panel measurements, rust detection, structural integrity, panel gaps',
          maxPoints: 50,
          category: 'Paint & Body',
          required: true,
          subCriteria: [
            { id: 'paint_condition', name: 'Paint Condition', maxPoints: 20 },
            { id: 'body_structure', name: 'Body Structure', maxPoints: 15 },
            { id: 'rust_corrosion', name: 'Rust & Corrosion', maxPoints: 10 },
            { id: 'panel_alignment', name: 'Panel Alignment', maxPoints: 5 }
          ]
        },
        // Extended Underbody (40 points)
        {
          id: 'underbody_advanced',
          name: 'Underbody Condition (Advanced)',
          description: 'Detailed underbody inspection, chassis integrity, suspension analysis, brake system, steering components',
          maxPoints: 40,
          category: 'Underbody',
          required: true,
          subCriteria: [
            { id: 'chassis_frame', name: 'Chassis & Frame', maxPoints: 15 },
            { id: 'suspension', name: 'Suspension Components', maxPoints: 15 },
            { id: 'brake_system', name: 'Brake System', maxPoints: 10 }
          ]
        },
        // Extended Interior (20 points)
        {
          id: 'interior_advanced',
          name: 'Interior Condition (Advanced)',
          description: 'Detailed interior check, upholstery condition, all controls and features, air conditioning, sound system',
          maxPoints: 20,
          category: 'Interior',
          required: true,
          subCriteria: [
            { id: 'upholstery_trim', name: 'Upholstery & Trim', maxPoints: 8 },
            { id: 'dashboard_controls', name: 'Dashboard & Controls', maxPoints: 7 },
            { id: 'cleanliness_odors', name: 'Cleanliness & Odors', maxPoints: 5 }
          ]
        },
        // Extended Documentation (20 points)
        {
          id: 'documentation_advanced',
          name: 'Documentation (Advanced)',
          description: 'Complete service history review, ownership verification, insurance documentation, warranty status',
          maxPoints: 20,
          category: 'Documentation',
          required: false,
          subCriteria: [
            { id: 'service_history', name: 'Service History', maxPoints: 10 },
            { id: 'ownership_registration', name: 'Ownership & Registration', maxPoints: 5 },
            { id: 'insurance_warranty', name: 'Insurance & Warranty', maxPoints: 5 }
          ]
        }
      ]),
      total_points: 240,
      is_active: true,
      is_global: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // =====================================================
  // ELECTRONICS TEMPLATE
  // =====================================================
  const electronicsCategoryId = getCategoryId('electronic') || getCategoryId('phone') || getCategoryId('laptop');
  if (electronicsCategoryId) {
    await knex('inspection_criteria_templates').insert({
      id: require('uuid').v4(),
      category_id: electronicsCategoryId,
      category_name: 'Electronics',
      template_name: 'Standard Electronics Inspection',
      description: 'Inspection checklist for electronic devices including functionality, physical condition, and accessories',
      criteria: JSON.stringify([
        {
          id: 'physical_condition',
          name: 'Physical Condition',
          description: 'Body, screen, buttons, ports, overall appearance',
          maxPoints: 25,
          category: 'Physical',
          required: true
        },
        {
          id: 'functionality',
          name: 'Functionality',
          description: 'All features working, performance, battery life, connectivity',
          maxPoints: 30,
          category: 'Functionality',
          required: true
        },
        {
          id: 'accessories',
          name: 'Accessories Included',
          description: 'Chargers, cables, cases, manuals, original packaging',
          maxPoints: 15,
          category: 'Accessories',
          required: false
        },
        {
          id: 'documentation',
          name: 'Documentation & Warranty',
          description: 'User manual, warranty card, purchase receipt, warranty status',
          maxPoints: 15,
          category: 'Documentation',
          required: false
        },
        {
          id: 'age_usage',
          name: 'Age & Usage Indicators',
          description: 'Battery health, wear patterns, usage history',
          maxPoints: 15,
          category: 'Condition',
          required: true
        }
      ]),
      total_points: 100,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // =====================================================
  // FURNITURE TEMPLATE
  // =====================================================
  const furnitureCategoryId = getCategoryId('furniture') || getCategoryId('chair') || getCategoryId('table');
  if (furnitureCategoryId) {
    await knex('inspection_criteria_templates').insert({
      id: require('uuid').v4(),
      category_id: furnitureCategoryId,
      category_name: 'Furniture',
      template_name: 'Standard Furniture Inspection',
      description: 'Inspection checklist for furniture including structural integrity, finish, and functionality',
      criteria: JSON.stringify([
        {
          id: 'structural',
          name: 'Structural Integrity',
          description: 'Frame stability, joints, legs, support structure',
          maxPoints: 30,
          category: 'Structure',
          required: true
        },
        {
          id: 'upholstery_finish',
          name: 'Upholstery & Finish',
          description: 'Fabric condition, stains, tears, wood finish, scratches',
          maxPoints: 25,
          category: 'Appearance',
          required: true
        },
        {
          id: 'functionality',
          name: 'Functionality',
          description: 'Moving parts, mechanisms, adjustments, drawers, doors',
          maxPoints: 20,
          category: 'Functionality',
          required: true
        },
        {
          id: 'condition',
          name: 'Overall Condition & Cleanliness',
          description: 'Cleanliness, odors, wear patterns, maintenance',
          maxPoints: 15,
          category: 'Condition',
          required: true
        },
        {
          id: 'accessories',
          name: 'Accessories & Parts',
          description: 'Cushions, covers, hardware, removable parts',
          maxPoints: 10,
          category: 'Accessories',
          required: false
        }
      ]),
      total_points: 100,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // =====================================================
  // GENERAL TEMPLATE (Fallback)
  // =====================================================
  await knex('inspection_criteria_templates').insert({
    id: require('uuid').v4(),
    category_id: categories[0]?.id || require('uuid').v4(), // Use first category or create placeholder
    category_name: 'General',
    template_name: 'General Product Inspection',
    description: 'General inspection checklist applicable to most product types',
    criteria: JSON.stringify([
      {
        id: 'physical_condition',
        name: 'Physical Condition',
        description: 'Overall physical appearance, damage, wear',
        maxPoints: 30,
        category: 'Physical',
        required: true
      },
      {
        id: 'functionality',
        name: 'Functionality',
        description: 'All features and functions working properly',
        maxPoints: 30,
        category: 'Functionality',
        required: true
      },
      {
        id: 'condition',
        name: 'Condition & Cleanliness',
        description: 'Cleanliness, maintenance, overall condition',
        maxPoints: 20,
        category: 'Condition',
        required: true
      },
      {
        id: 'accessories',
        name: 'Accessories & Documentation',
        description: 'Included accessories, manuals, documentation',
        maxPoints: 20,
        category: 'Accessories',
        required: false
      }
    ]),
    total_points: 100,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  });

  console.log('✅ Inspection criteria templates seeded successfully');
}

