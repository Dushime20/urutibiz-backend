import logger from '../utils/logger';
import { ProductFilters, ProductCondition } from '../types/product.types';
import CategoryService from './category.service';
import { Category } from '../types/category.types';

class AISearchService {
  private categories: Category[] = [];
  private lastCategoryFetch: number = 0;
  private readonly CATEGORY_CACHE_TTL = 300000; // 5 minutes

  private async ensureCategoriesLoaded() {
    try {
      if (
        this.categories.length === 0 || 
        Date.now() - this.lastCategoryFetch > this.CATEGORY_CACHE_TTL
      ) {
        this.categories = await CategoryService.listCategories();
        this.lastCategoryFetch = Date.now();
        logger.info(`[AISearchService] Loaded ${this.categories.length} categories`);
      }
    } catch (error) {
      logger.error('[AISearchService] Failed to load categories:', error);
    }
  }

  /**
   * Alibaba-style deep search: Parse natural language into structured filters
   * Example: "camera in kigali which is at least 30000 rwf cost"
   */
  async parseNaturalLanguageQuery(prompt: string): Promise<Partial<ProductFilters> & { keywords?: string[] }> {
    const filters: Partial<ProductFilters> = {};
    let searchTerms = prompt.toLowerCase();

    await this.ensureCategoriesLoaded();

    // Extract Location: "in Kigali", "at Kigali", "from Kigali"
    const locationMatch = searchTerms.match(/\b(?:in|at|from|near)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (locationMatch) {
      // Store location as search term since ProductFilters.location expects coordinates
      searchTerms = searchTerms.replace(locationMatch[0], locationMatch[1]);
    }

    // Extract Price with currency: "at least 30000 rwf", "minimum 30000"
    const minPriceMatch = searchTerms.match(/(?:at least|minimum|min|over|above|>)\s?(\d+)\s?(?:rwf|usd|\$)?/i);
    if (minPriceMatch) {
      filters.min_price = parseInt(minPriceMatch[1]);
      searchTerms = searchTerms.replace(minPriceMatch[0], '');
    }

    const maxPriceMatch = searchTerms.match(/(?:under|below|<|max|maximum)\s?(\d+)\s?(?:rwf|usd|\$)?/i);
    if (maxPriceMatch) {
      filters.max_price = parseInt(maxPriceMatch[1]);
      searchTerms = searchTerms.replace(maxPriceMatch[0], '');
    }

    const rangePriceMatch = searchTerms.match(/(\d+)\s?(?:-|to)\s?(\d+)\s?(?:rwf|usd|\$)?/i);
    if (rangePriceMatch && !filters.min_price && !filters.max_price) {
      filters.min_price = parseInt(rangePriceMatch[1]);
      filters.max_price = parseInt(rangePriceMatch[2]);
      searchTerms = searchTerms.replace(rangePriceMatch[0], '');
    }

    if (!filters.min_price && !filters.max_price) {
      const costMatch = searchTerms.match(/(?:cost|price|worth)\s?(\d+)\s?(?:rwf|usd|\$)?/i);
      if (costMatch) {
        filters.min_price = parseInt(costMatch[1]);
        searchTerms = searchTerms.replace(costMatch[0], '');
      }
    }

    // Match Categories
    let matchedCategory: Category | null = null;
    let maxLen = 0;

    for (const cat of this.categories) {
      const catName = cat.name.toLowerCase();
      const regex = new RegExp(`\\b${catName}\\b`, 'i');
      if (regex.test(searchTerms)) {
        if (catName.length > maxLen) {
          matchedCategory = cat;
          maxLen = catName.length;
        }
      }
    }

    if (matchedCategory) {
      filters.category_id = matchedCategory.id;
      const regex = new RegExp(`\\b${matchedCategory.name.toLowerCase()}\\b`, 'i');
      searchTerms = searchTerms.replace(regex, '');
    }

    // Extract Condition
    const conditions = ['new', 'like new', 'good', 'fair', 'poor', 'used', 'refurbished'];
    for (const cond of conditions) {
      const regex = new RegExp(`\\b${cond}\\b`, 'i');
      if (regex.test(searchTerms)) {
        if (cond === 'used') {
          filters.condition = 'good';
        } else if (cond === 'refurbished') {
          filters.condition = 'like_new';
        } else {
          const mapped = cond.replace(' ', '_');
          const validConditions: ProductCondition[] = ['new', 'like_new', 'good', 'fair', 'poor'];
          if ((validConditions as string[]).includes(mapped)) {
            filters.condition = mapped as ProductCondition;
          }
        }
        searchTerms = searchTerms.replace(regex, '');
        break;
      }
    }

    // Cleanup
    searchTerms = searchTerms
      .replace(/\b(i want|i need|looking for|find me|buy|which is|that is)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (searchTerms.length > 0) {
      filters.search = searchTerms;
    }

    logger.info('[AISearchService] Deep search parsed:', { original: prompt, parsed: filters });

    return filters;
  }
}

export default new AISearchService();
