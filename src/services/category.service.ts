import { getDatabase } from '@/config/database';
import { Category } from '@/types/category.types';
import { v4 as uuidv4 } from 'uuid';

export default class CategoryService {
  static async createCategory(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const db = getDatabase();
    const [row] = await db('categories')
      .insert({
        id: uuidv4(),
        name: data.name,
        slug: data.slug,
        description: data.description,
        parent_id: data.parentId,
        image_url: data.imageUrl,
        icon_name: data.iconName,
        sort_order: data.sortOrder || 0,
        is_active: data.isActive ?? true,
        // Note: status field will be added when database migration is run
        created_at: new Date()
      }, '*');
    return CategoryService.fromDb(row);
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    const db = getDatabase();
    const row = await db('categories').where({ id }).first();
    return row ? CategoryService.fromDb(row) : null;
  }

  static async listCategories(): Promise<Category[]> {
    const db = getDatabase();
    const rows = await db('categories')
      .orderBy('sort_order', 'asc');
    return rows.map(CategoryService.fromDb);
  }

  static async updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category | null> {
    const db = getDatabase();
    
    // Check if category exists
    const existingCategory = await db('categories').where({ id }).first();
    if (!existingCategory) {
      return null;
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.iconName !== undefined) updateData.icon_name = data.iconName;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    // Note: status field will be added when database migration is run
    
    updateData.updated_at = new Date();

    const [row] = await db('categories')
      .where({ id })
      .update(updateData, '*');
    
    return row ? CategoryService.fromDb(row) : null;
  }

  static async deleteCategory(id: string, hardDelete: boolean = false): Promise<boolean> {
    const db = getDatabase();
    
    // Check if category exists
    const existingCategory = await db('categories').where({ id }).first();
    if (!existingCategory) {
      return false;
    }

    // Check if category has children (subcategories)
    const childCategories = await db('categories').where({ parent_id: id }).first();
    if (childCategories) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Check if category is used by products
    const productsUsingCategory = await db('products').where({ category_id: id }).first();
    if (productsUsingCategory) {
      throw new Error('Cannot delete category that is used by products');
    }

    if (hardDelete) {
      // Hard delete - completely remove from database
      const deletedCount = await db('categories').where({ id }).del();
      return deletedCount > 0;
    } else {
      // Soft delete - set is_active to false (temporary until status column is added)
      const [deletedCategory] = await db('categories')
        .where({ id })
        .update({ 
          is_active: false,
          updated_at: new Date()
        }, '*');
      
      return !!deletedCategory;
    }
  }

  static async restoreCategory(id: string): Promise<Category | null> {
    const db = getDatabase();
    
    // Check if category exists
    const existingCategory = await db('categories').where({ id }).first();
    if (!existingCategory) {
      return null;
    }

    // Restore the category by setting is_active back to true (temporary until status column is added)
    const [restoredCategory] = await db('categories')
      .where({ id })
      .update({ 
        is_active: true,
        updated_at: new Date()
      }, '*');
    
    return restoredCategory ? CategoryService.fromDb(restoredCategory) : null;
  }

  static fromDb(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      parentId: row.parent_id,
      imageUrl: row.image_url,
      iconName: row.icon_name,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      status: 'active', // Default to active until status column is added
      createdAt: row.created_at ? row.created_at.toISOString() : '',
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    };
  }
}
