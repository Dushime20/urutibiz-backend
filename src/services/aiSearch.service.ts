import logger from '../utils/logger';
import { ProductFilters, ProductCondition } from '../types/product.types';
import CategoryService from './category.service';
import { Category } from '../types/category.types';

class AISearchService {
  private categories: Category[] = [];
  private lastCategoryFetch: number = 0;
  private readonly CATEGORY_CACHE_TTL = 300000; // 5 minutes

  /**
   * Ensures categories are loaded and cached
   */
  private async ensureCategoriesLoaded() {
    try {
      if (
        this.categories.length === 0 || 
        Date.now() - this.lastCategoryFetch > this.CATEGORY_CACHE_TTL
      ) {
        this.categories = await CategoryService.listCategories();
        this.lastCategoryFetch = Date.now();
        logger.info(`[AISearchService] Loaded ${this.categories.length} categories for smart matching`);
      }
    } catch (error) {
      logger.error('[AISearchService] Failed to load categories:', error);
      // Don't fail the request, just continue with empty categories
    }
  }

  /**
   * Analyzes a natural language prompt and converts it into structured product filters
   * using a local rule-based algorithm instead of external AI.
   */
  async parseNaturalLanguageQuery(prompt: string): Promise<Partial<ProductFilters> & { keywords?: string[] }> {
    const filters: Partial<ProductFilters> = {};
    let searchTerms = prompt.toLowerCase();

    // 1. Ensure reference data is loaded
    await this.ensureCategoriesLoaded();

    // 2. Extract Price Ranges
    // Pattern: "under 500", "below $500", "< 500"
    const maxPriceMatch = searchTerms.match(/(?:under|below|<|max)\s?\$?(\d+)/i);
    if (maxPriceMatch) {
      filters.max_price = parseInt(maxPriceMatch[1]);
      searchTerms = searchTerms.replace(maxPriceMatch[0], '');
    }

    // Pattern: "over 100", "above $100", "> 100", "min 100"
    const minPriceMatch = searchTerms.match(/(?:over|above|>|min)\s?\$?(\d+)/i);
    if (minPriceMatch) {
      filters.min_price = parseInt(minPriceMatch[1]);
      searchTerms = searchTerms.replace(minPriceMatch[0], '');
    }

    // Pattern: "100-500", "$100 to $500"
    const rangePriceMatch = searchTerms.match(/\$?(\d+)\s?(?:-|to)\s?\$?(\d+)/i);
    if (rangePriceMatch) {
      filters.min_price = parseInt(rangePriceMatch[1]);
      filters.max_price = parseInt(rangePriceMatch[2]);
      searchTerms = searchTerms.replace(rangePriceMatch[0], '');
    }

    // 3. Match Categories (Dynamic from DB)
    // We look for category names in the prompt
    let matchedCategory: Category | null = null;
    let maxLen = 0;

    for (const cat of this.categories) {
      const catName = cat.name.toLowerCase();
      // Simple inclusion check. 
      // Enhance: use regex with boundary \b to avoid partial word matches (e.g. "car" in "scarf")
      const regex = new RegExp(`\\b${catName}\\b`, 'i');
      if (regex.test(searchTerms)) {
        // Pick the longest string match (e.g. prefer "smart watch" over "watch")
        if (catName.length > maxLen) {
          matchedCategory = cat;
          maxLen = catName.length;
        }
      }
    }

    if (matchedCategory) {
      filters.category_id = matchedCategory.id;
      // Remove only the matched category name from search terms to clean up the query
      const regex = new RegExp(`\\b${matchedCategory.name.toLowerCase()}\\b`, 'i');
      searchTerms = searchTerms.replace(regex, '');
    } else {
        // Fallback: Check common mappings if DB match fails or for synonyms
        const categoryMappings: Record<string, string> = {
            'laptop': 'electronics',
            'phone': 'electronics',
            'car': 'vehicles',
            'iphone': 'electronics',
            'house': 'real_estate',
            'apartment': 'real_estate'
        };
        
        // This is a "nice to have" fallback, but depends on knowing the DB IDs or names. 
        // For now, we rely primarily on the DB loop above.
    }

    // 4. Extract Condition
    const conditions = ['new', 'like new', 'good', 'fair', 'poor', 'used', 'refurbished', 'second hand'];
    for (const cond of conditions) {
         const regex = new RegExp(`\\b${cond}\\b`, 'i');
         if (regex.test(searchTerms)) {
             if (cond === 'used' || cond === 'second hand') {
                 // 'used' acts as a general filter, maybe map to 'good' or just leave generic?
                 // The system expects specific enum. Let's map strict ones.
                 filters.condition = 'good'; // Default "used" to "good"
             } else if (cond === 'refurbished') {
                 filters.condition = 'like_new';
             } else {
                // Approximate mapping for multi-word like "like new" -> "like_new"
                const mapped = cond.replace(' ', '_');
                // Verify it's valid enum
                const validConditions: ProductCondition[] = ['new', 'like_new', 'good', 'fair', 'poor'];
                if ((validConditions as string[]).includes(mapped)) {
                    filters.condition = mapped as ProductCondition;
                }
             }
             searchTerms = searchTerms.replace(regex, '');
             break; // Only take one condition
         }
    }

    // 5. Cleanup Search Terms
    // Remove common stop words and extra spaces
    searchTerms = searchTerms
      .replace(/\b(i want|i need|looking for|find me|buy|cheap|expensive|budget)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If "cheap" was in the original prompt (before cleanup), sort by price
    if (/\b(cheap|cheapest|budget|low cost)\b/i.test(prompt)) {
        // We don't have a direct 'sort' field in ProductFilters usually, 
        // but the Controller might handle it if we passed it. 
        // The current interface Partial<ProductFilters> might not support sort_by directly 
        // based on the previous file content (it had min_price, etc).
        // However, the AI service signature returns Partial<ProductFilters>, 
        // so we stick to filters. 
        // If we want to support sort, we'd need to extend the type or the controller logic.
        // For now, let's assume 'sort' isn't easily injectable via filters unless we added it.
    }

    // Assign the cleaned text as the search query
    if (searchTerms.length > 0) {
      filters.search = searchTerms;
    }

    logger.info('[AISearchService] Local parse result:', {
        original: prompt,
        parsed: filters
    });

    return filters;
  }
}

export default new AISearchService();
