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
      You are an Alibaba-style Deep Search engine. Your goal is to parse natural language into deep, structured search filters.
      
      Available Categories: ${categoryNames}
      
      Extract the following Deep Search attributes (Return ONLY a JSON object):
      - min_price (number, optional): Minimum price intent.
      - max_price (number, optional): Maximum price intent.
      - currency (string, optional): Local currency (RWF, KES, USD, etc.).
      - category_id (string, optional): ID of the exact or best-matching category.
      - condition (string, optional): 'new', 'like_new', 'good', 'fair', 'poor'.
      - location_text (string, optional): Specific location mentioned (city/neighborhood).
      - specifications (object, optional): Key-value pairs of technical attributes (e.g., color, brand, material, size, model).
      - keywords (string[]): Cleaned, high-intent keywords for semantic search (exclude stop words).
      - sort (string, optional): User's sorting intent. One of: 'price_asc', 'price_desc', 'rating', 'newest'.
      
      Strict Rules:
      1. If the user says "cheap", "affordable", or "budget", set 'sort' to 'price_asc'.
      2. If the user says "best", "top rated", or "premium", set 'sort' to 'rating'.
      3. If the user says "newest" or "latest", set 'sort' to 'newest'.
      4. Avoid including price or category words in the 'keywords' array.
      
      Example: "I need a cheap red Toyota car in Nairobi under 5M"
      Output: { 
        "max_price": 5000000, 
        "currency": "KES", 
        "location_text": "Nairobi", 
        "keywords": ["car"], 
        "category_id": "cars_id...",
        "sort": "price_asc",
        "specifications": { "brand": "Toyota", "color": "red" }
      }
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

      // Map category ID or name
      if (parsedJson.category_id) {
        const cat = this.categories.find(c => c.id === parsedJson.category_id || c.name.toLowerCase() === parsedJson.category_id.toLowerCase());
        if (cat) filters.category_id = cat.id;
      }

      if (parsedJson.condition) filters.condition = parsedJson.condition;
      if (parsedJson.location_text) filters.location_text = parsedJson.location_text;
      if (parsedJson.specifications) filters.specifications = parsedJson.specifications;

      // Map sort intent to controller-friendly format
      if (parsedJson.sort) {
        if (parsedJson.sort === 'price_asc') {
          filters.sort = 'price';
          filters.sortOrder = 'asc';
        } else if (parsedJson.sort === 'price_desc') {
          filters.sort = 'price';
          filters.sortOrder = 'desc';
        } else {
          filters.sort = parsedJson.sort;
        }
      }

      if (parsedJson.keywords && Array.isArray(parsedJson.keywords)) {
        filters.search = parsedJson.keywords.join(' ');
      }

      logger.info('[AISearchService] Alibaba Deep Search Parsed:', { original: prompt, result: parsedJson });
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
