import Groq from 'groq-sdk';
import logger from '../utils/logger';
import { ProductFilters, ProductCondition } from '../types/product.types';
import CategoryService from './category.service';
import { Category } from '../types/category.types';
import config from '../config/config';

class AISearchService {
  private categories: Category[] = [];
  private lastCategoryFetch: number = 0;
  private readonly CATEGORY_CACHE_TTL = 300000; // 5 minutes
  private groq: Groq | null = null;

  constructor() {
    if (config.ai.groqApiKey) {
      this.groq = new Groq({
        apiKey: config.ai.groqApiKey
      });
      logger.info('[AISearchService] Groq AI initialized');
    } else {
      logger.warn('[AISearchService] Groq API key missing, AI search will fallback to regex');
    }
  }

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
   * Uses Groq AI (Llama 3) for semantic understanding, falls back to regex
   */
  async parseNaturalLanguageQuery(prompt: string): Promise<Partial<ProductFilters> & { keywords?: string[] }> {
    await this.ensureCategoriesLoaded();

    // 1. Try AI Parsing first
    if (this.groq) {
      try {
        const aiResult = await this.parseWithAI(prompt);
        if (aiResult) {
          logger.info('[AISearchService] AI parsing successful');
          return aiResult;
        }
      } catch (error) {
        logger.error('[AISearchService] AI parsing failed, falling back to regex:', error);
      }
    }

    // 2. Fallback to Regex Parsing
    logger.info('[AISearchService] Using regex fallback');
    return this.parseWithRegex(prompt);
  }

  /**
   * Parse query using Groq AI (Llama 3)
   */
  private async parseWithAI(prompt: string): Promise<Partial<ProductFilters> & { keywords?: string[] } | null> {
    if (!this.groq) return null;

    const categoryNames = this.categories.map(c => c.name).join(', ');

    const systemPrompt = `
      You are an e-commerce search parser. Extract structured search filters from the user's natural language query.
      
      Available Categories: ${categoryNames}
      
      Return ONLY a JSON object with these fields (no markdown, no explanation):
      - min_price (number, optional): inferred minimum price
      - max_price (number, optional): inferred maximum price
      - currency (string, optional): inferred currency (default to RWF if local context implies)
      - category_id (string, optional): ID of the BEST matching category from the list above. Return null if no good match.
      - condition (string, optional): One of: 'new', 'like_new', 'good', 'fair', 'poor'
      - keywords (string[]): Cleaned search keywords (remove stopwords, price mentions, location mentions)
      - location (object, optional): { latitude: number, longitude: number, radius: number } ONLY if explicit specific location found.
      - location_text (string, optional): Extracted location name like "Kigali", "Gisenyi"
      
      Example: "cheap red car in Kigali under 5M"
      Output: { "max_price": 5000000, "currency": "RWF", "location_text": "Kigali", "keywords": ["red", "car"], "category_id": "cars_id..." }
    `;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return null;

      const result = JSON.parse(content);
      const filters: any = {};

      if (result.min_price) filters.min_price = result.min_price;
      if (result.max_price) filters.max_price = result.max_price;
      if (result.currency) filters.currency = result.currency;

      // Map category name back to ID if AI didn't return ID directly
      if (result.category_id) {
        // Did AI return a name instead of ID? Let's check.
        const cat = this.categories.find(c => c.id === result.category_id || c.name.toLowerCase() === result.category_id.toLowerCase());
        if (cat) filters.category_id = cat.id;
      }
      // Fallback: fuzzy match category from keywords if ID missing but category inferred
      else if (result.category_name) {
        const cat = this.categories.find(c => c.name.toLowerCase() === result.category_name.toLowerCase());
        if (cat) filters.category_id = cat.id;
      }

      if (result.condition) filters.condition = result.condition;

      // Pass location text to search param if not structured
      if (result.location_text) {
        // If we can't geocode here, we might append to keywords or handle in controller
        // For now, let's keep it in keywords if not handled separately
        if (!filters.search) filters.search = "";
        // filters.search += " " + result.location_text; 
      }

      if (result.keywords && Array.isArray(result.keywords)) {
        filters.search = result.keywords.join(' ');
      }

      logger.info('[AISearchService] Groq Parsed:', { original: prompt, result });
      return filters;

    } catch (error) {
      console.error('Groq API Error:', error);
      return null;
    }
  }

  /**
   * Regex-based fallback parser (Original Logic)
   */
  private parseWithRegex(prompt: string): Partial<ProductFilters> & { keywords?: string[] } {
    const filters: Partial<ProductFilters> = {};
    let searchTerms = prompt.toLowerCase();

    // Extract Location: "in Kigali", "at Kigali", "from Kigali"
    const locationMatch = searchTerms.match(/\b(?:in|at|from|near)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (locationMatch) {
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

    logger.info('[AISearchService] Regex Parsed:', { original: prompt, parsed: filters });
    return filters;
  }
}

export default new AISearchService();
