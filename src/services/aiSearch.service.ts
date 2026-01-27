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
      You are an Alibaba-style Deep Search Architect. Your role is query understanding (STAGE 1).
      Analyze the user's natural language query and extract structured intent.
      
      Available Categories: ${categoryNames}
      
      Extract the following (Return ONLY a JSON object):
      - primary_intent: (e.g., "buy", "find", "compare")
      - filters: {
          category_id: (best matching ID),
          location_text: (location name),
          min_price: (number),
          max_price: (number),
          currency: (string, e.g., "RWF"),
          condition: (new, like_new, good, fair, poor),
          attributes: { (key-value pairs of features/specs like red, toyota, 8GB) }
        }
      - semantic_query: (Cleaned descriptive phrase for vector search, e.g. "camera that works well at night")
      - keywords: (Array of core product keywords)
      - sort_intent: (price_asc, price_desc, rating, newest)
      
      Strict Rule: Identify multiple intents if present (e.g., "car and a house"). 
      For multi-intent queries, merge them into a single coherent semantic_query but keep keywords separate.
      
      Output MUST be valid JSON.
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

      // Map to ProductFilters for the rest of the app
      const filters: Partial<ProductFilters> = {};
      const rawFilters = parsedJson.filters || {};

      if (rawFilters.min_price) filters.min_price = rawFilters.min_price;
      if (rawFilters.max_price) filters.max_price = rawFilters.max_price;
      if (rawFilters.currency) filters.currency = rawFilters.currency;

      if (rawFilters.category_id) {
        const cat = this.categories.find(c => c.id === rawFilters.category_id || c.name.toLowerCase() === rawFilters.category_id.toLowerCase());
        if (cat) filters.category_id = cat.id;
      }

      if (rawFilters.condition) filters.condition = rawFilters.condition;
      if (rawFilters.location_text) filters.location_text = rawFilters.location_text;
      if (rawFilters.attributes) filters.specifications = rawFilters.attributes;

      // Handle sorting
      if (parsedJson.sort_intent) {
        if (parsedJson.sort_intent === 'price_asc') {
          filters.sort = 'price';
          filters.sortOrder = 'asc';
        } else if (parsedJson.sort_intent === 'price_desc') {
          filters.sort = 'price';
          filters.sortOrder = 'desc';
        } else {
          filters.sort = parsedJson.sort_intent;
        }
      }

      if (parsedJson.keywords && Array.isArray(parsedJson.keywords)) {
        filters.search = parsedJson.keywords.join(' ');
      }

      // Semantic query for vector search (Step 2)
      if (parsedJson.semantic_query) {
        try {
          filters.text_embedding = await this.generateTextEmbedding(parsedJson.semantic_query);
        } catch (e) {
          logger.warn('[AISearchService] Semantic embedding failed, using fallback keyword mapping');
        }
      }

      logger.info('[AISearchService] Alibaba Deep Search Result:', {
        intent: parsedJson.primary_intent,
        semantic: parsedJson.semantic_query,
        filters: filters
      });

      return filters;

    } catch (error) {
      logger.error('[AISearchService] Gemini parsing or embedding failed:', error);
      return null;
    }
  }

  /**
   * STEP 2: Semantic Representation
   * Convert descriptive phrase into a vector embedding
   */
  private async generateTextEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) throw new Error('Gemini not initialized');

    // text-embedding-004 is current standard
    const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
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
