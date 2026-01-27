import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { ProductFilters, ProductCondition } from '../types/product.types';
import CategoryService from './category.service';
import { Category } from '../types/category.types';
import config from '../config/config';

class AISearchService {
  private categories: Category[] = [];
  private lastCategoryFetch: number = 0;
  private readonly CATEGORY_CACHE_TTL = 300000; // 5 minutes
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.ai.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
      logger.info('[AISearchService] Gemini AI initialized');
    } else {
      logger.warn('[AISearchService] Gemini API key missing, AI search will fallback to regex');
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
   * Uses Google Gemini for semantic understanding, falls back to regex
   */
  async parseNaturalLanguageQuery(prompt: string): Promise<Partial<ProductFilters> & { keywords?: string[] }> {
    await this.ensureCategoriesLoaded();

    // 1. Try AI Parsing first
    if (this.genAI) {
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
   * Parse query using Google Gemini
   */
  private async parseWithAI(prompt: string): Promise<Partial<ProductFilters> & { keywords?: string[] } | null> {
    if (!this.genAI) return null;

    const categoryNames = this.categories.map(c => c.name).join(', ');
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
      - location_text (string, optional): Extracted location name like "Kigali", "Nairobi"
      
      Example: "cheap red car in Nairobi under 5M"
      Output: { "max_price": 5000000, "currency": "KES", "location_text": "Nairobi", "keywords": ["red", "car"], "category_id": "cars_id..." }
    `;

    try {
      const result = await model.generateContent([systemPrompt, prompt]);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up markdown if AI returned it
      if (text.startsWith('```json')) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/```/g, '').trim();
      }

      const parsedJson = JSON.parse(text);
      const filters: any = {};

      if (parsedJson.min_price) filters.min_price = parsedJson.min_price;
      if (parsedJson.max_price) filters.max_price = parsedJson.max_price;
      if (parsedJson.currency) filters.currency = parsedJson.currency;

      // Map category name back to ID if AI didn't return ID directly
      if (parsedJson.category_id) {
        const cat = this.categories.find(c => c.id === parsedJson.category_id || c.name.toLowerCase() === parsedJson.category_id.toLowerCase());
        if (cat) filters.category_id = cat.id;
      } else if (parsedJson.category_name) {
        const cat = this.categories.find(c => c.name.toLowerCase() === parsedJson.category_name.toLowerCase());
        if (cat) filters.category_id = cat.id;
      }

      if (parsedJson.condition) filters.condition = parsedJson.condition;

      if (parsedJson.keywords && Array.isArray(parsedJson.keywords) && !filters.category_id) {
        filters.search = parsedJson.keywords.join(' ');
      }

      // If location text is found, we could potentially geocode it, but for now we'll log it
      if (parsedJson.location_text) {
        logger.info(`[AISearchService] Location detected: ${parsedJson.location_text}`);
      }

      logger.info('[AISearchService] Gemini Parsed:', { original: prompt, result: parsedJson });
      return filters;

    } catch (error) {
      logger.error('[AISearchService] Gemini API Error:', error);
      return null;
    }
  }

  /**
   * Regex-based fallback parser
   */
  private parseWithRegex(prompt: string): Partial<ProductFilters> & { keywords?: string[] } {
    const filters: Partial<ProductFilters> = {};
    let searchTerms = prompt.toLowerCase();

    // Extract Location: "in Kigali", "at Nairobi", "from Gisenyi"
    const locationMatch = searchTerms.match(/\b(?:in|at|from|near)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (locationMatch) {
      searchTerms = searchTerms.replace(locationMatch[0], locationMatch[1]);
    }

    // Extract Price with currency
    const minPriceMatch = searchTerms.match(/(?:at least|minimum|min|over|above|>)\s?(\d+)\s?(?:rwf|usd|kes|\$)?/i);
    if (minPriceMatch) {
      filters.min_price = parseInt(minPriceMatch[1]);
      searchTerms = searchTerms.replace(minPriceMatch[0], '');
    }

    const maxPriceMatch = searchTerms.match(/(?:under|below|<|max|maximum)\s?(\d+)\s?(?:rwf|usd|kes|\$)?/i);
    if (maxPriceMatch) {
      filters.max_price = parseInt(maxPriceMatch[1]);
      searchTerms = searchTerms.replace(maxPriceMatch[0], '');
    }

    const rangePriceMatch = searchTerms.match(/(\d+)\s?(?:-|to)\s?(\d+)\s?(?:rwf|usd|kes|\$)?/i);
    if (rangePriceMatch && !filters.min_price && !filters.max_price) {
      filters.min_price = parseInt(rangePriceMatch[1]);
      filters.max_price = parseInt(rangePriceMatch[2]);
      searchTerms = searchTerms.replace(rangePriceMatch[0], '');
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

    searchTerms = searchTerms
      .replace(/\b(i want|i need|looking for|find me|buy|which is|that is|for|rent|sale|to)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (searchTerms.length > 2 && !matchedCategory) {
      filters.search = searchTerms;
    }

    logger.info('[AISearchService] Regex Parsed:', { original: prompt, parsed: filters });
    return filters;
  }
}

export default new AISearchService();
