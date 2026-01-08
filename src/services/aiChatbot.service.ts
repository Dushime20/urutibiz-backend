import axios from 'axios';
import config from '../config/config';
import logger from '../utils/logger';
import ProductRepository from '../repositories/ProductRepository';
import { Product, ProductFilters } from '../types/product.types';
import { getDatabase } from '../config/database';

interface ChatIntent {
  product_name?: string;
  category?: string;
  location?: string;
  max_price?: number;
  duration?: string;
  type?: 'search' | 'greeting' | 'general';
  conversational_response?: string;
}

interface ScoredProduct extends Product {
  score: number;
  reasons: string[];
}

export class AIChatbotService {
  private readonly groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.3-70b-versatile'; // Updated from deprecated llama3-8b-8192
  private categories: any[] = [];

  /**
   * Processes a natural language query from a user
   */
  async processChatQuery(message: string, userId?: string): Promise<{
    message: string;
    recommendations: ScoredProduct[];
    intent: ChatIntent;
  }> {
    try {
      // 1. Ensure categories are loaded for mapping
      await this.ensureCategoriesLoaded();

      // 2. Extract intent using Groq
      const intent = await this.extractIntent(message);
      logger.info(`[AIChatbotService] Extracted intent: ${JSON.stringify(intent)}`);

      // 3. Handle non-search intents (Greetings/General talk) or empty search
      if (intent.type !== 'search' || (!intent.product_name && !intent.category && !intent.location)) {
        return {
          message: intent.conversational_response || "I'm here to help you find the best rentals! What are you looking for today? (e.g., 'I need a camera' or 'Looking for a flat in Kigali')",
          recommendations: [],
          intent: { ...intent, type: intent.type || 'general' }
        };
      }

      // 4. Map category name to ID if found
      let matchedCategoryId: string | null = null;
      if (intent.category) {
        const cat = this.categories.find(c => 
          c.name.toLowerCase().includes(intent.category?.toLowerCase()) || 
          intent.category?.toLowerCase().includes(c.name.toLowerCase())
        );
        if (cat) {
          matchedCategoryId = cat.id;
          logger.info(`[AIChatbotService] Mapped category "${intent.category}" to ID: ${matchedCategoryId}`);
        }
      }

      // 5. Query products based on intent
      const searchCriteria: any = {
        status: 'active'
      };

      if (intent.product_name) searchCriteria.search = intent.product_name;
      if (intent.max_price) searchCriteria.max_price = intent.max_price;
      if (matchedCategoryId) searchCriteria.category_id = matchedCategoryId;
      
      const productsResult = await ProductRepository.findPaginated(searchCriteria, 1, 15);
      const candidates: any[] = productsResult.data.data;

      // 6. Rank and score candidates
      const scoredProducts = await this.scoreProducts(candidates, intent);

      // 7. Generate AI response message
      const responseMessage = this.generateResponse(intent, scoredProducts);

      return {
        message: responseMessage,
        recommendations: scoredProducts.slice(0, 3) as ScoredProduct[],
        intent
      };
    } catch (error) {
      logger.error('[AIChatbotService] Error processing chat query:', error);
      throw error;
    }
  }

  /**
   * Loads categories from database if not already cached
   */
  private async ensureCategoriesLoaded(): Promise<void> {
    if (this.categories.length > 0) return;
    
    try {
      const db = getDatabase();
      this.categories = await db('categories').select('id', 'name');
      logger.info(`[AIChatbotService] Loaded ${this.categories.length} categories for mapping.`);
    } catch (error) {
      logger.error('[AIChatbotService] Failed to load categories:', error);
    }
  }

  /**
   * Calls Groq API to extract structured data from user message
   */
  private async extractIntent(message: string): Promise<ChatIntent> {
    const apiKey = config.ai.groqApiKey;

    if (!apiKey) {
      logger.error('[AIChatbotService] ❌ No Groq API Key found in config! Check your .env file for GROQ_API_KEY.');
      logger.info('[AIChatbotService] Using mock intent fallback.');
      return this.mockIntentExtraction(message);
    }

    const categoryList = this.categories.map(c => c.name).join(', ');
    const systemPrompt = `
      You are an AI assistant for an e-rental marketplace. 
      Your task is to analyze the user's message and determine if they are looking to rent something specific or just chatting.

      CRITICAL RULES:
      1. If the user is just saying hello (e.g., "hi", "hey", "hello", "good morning"), set type to "greeting".
      2. If the user is asking a general question not about a specific rental, set type to "general".
      3. Only set type to "search" if they mention an item, category, or location they want to rent/find.
      4. For "greeting" or "general", provide a helpful "conversational_response".

      Return ONLY a valid JSON object with these fields:
      - type: "search", "greeting", or "general"
      - conversational_response: A friendly reply (required for greeting/general)
      - product_name: The specific item (ONLY for search)
      - category: The general category (Try to match: ${categoryList})
      - location: Desired location or city
      - max_price: Maximum budget amount (number)
      - duration: Rental period
    `;

    try {
      const response = await axios.post(
        this.groqUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        logger.error('[AIChatbotService] ❌ Failed to parse Groq response JSON:', content);
        throw parseError;
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      logger.error(`[AIChatbotService] ❌ Groq extraction failed: ${errorMsg}`);
      
      // If it's a 401, definitely log that it's an API Key issue
      if (error.response?.status === 401) {
        logger.error('[AIChatbotService] ❌ Unauthorized! Your GROQ_API_KEY might be invalid.');
      }

      logger.info('[AIChatbotService] Falling back to mock extraction.');
      return this.mockIntentExtraction(message);
    }
  }

  /**
   * Fallback/Mock extraction logic
   */
  private mockIntentExtraction(message: string): ChatIntent {
    const msg = message.toLowerCase().trim();
    
    // Check for greetings
    const greetings = ['hi', 'hello', 'hey', 'yo', 'morning', 'afternoon'];
    if (greetings.some(g => msg === g || msg.startsWith(g + ' ') || (msg.startsWith(g) && msg.length < 5))) {
      return { 
        type: 'greeting', 
        conversational_response: "Hello! I'm your AI Rental Assistant. What can I help you find today? You can search for cameras, cars, and more!" 
      };
    }

    const intent: ChatIntent = { type: 'search' };
    
    // 2. Check for keywords in our known categories
    if (this.categories.length > 0) {
      const foundCategory = this.categories.find(c => 
        msg.includes(c.name.toLowerCase()) || 
        c.name.toLowerCase().includes(msg)
      );
      if (foundCategory) {
        intent.category = foundCategory.name;
        // If the message is short and just contains the category, use it as product_name too
        if (msg.length < 20) intent.product_name = msg;
      }
    }

    // 3. Very basic regex rules as fallback
    if (msg.includes('camera')) {
      intent.product_name = 'camera';
      intent.category = 'electronics';
    }
    if (msg.includes('car') || msg.includes('vehicle') || msg.includes('transport') || msg.includes('truck')) {
      intent.product_name = msg.includes('car') ? 'car' : 'vehicle';
      intent.category = 'transportation';
    }
    if (msg.includes('house') || msg.includes('apartment') || msg.includes('flat') || msg.includes('room')) {
      intent.product_name = 'house';
      intent.category = 'accommodation';
    }
    if (msg.includes('kigali')) intent.location = 'Kigali';
    
    // 4. Try to find potential location from capitalized words (if not Kigali)
    if (!intent.location) {
      const words = message.split(' ');
      const capitals = words.filter(w => w.length > 0 && w[0] === w[0].toUpperCase() && !greetings.includes(w.toLowerCase()));
      if (capitals.length > 0) {
        // If we found capitalized words and no product name yet, maybe it's a product or location
        if (!intent.product_name) intent.product_name = capitals[0];
        else intent.location = capitals[0];
      }
    }

    // 5. Price extraction
    const priceMatch = msg.match(/(\d+)\s?k/);
    if (priceMatch) intent.max_price = parseInt(priceMatch[1]) * 1000;
    else {
      const directPriceMatch = msg.match(/under\s?(\d+)/);
      if (directPriceMatch) intent.max_price = parseInt(directPriceMatch[directPriceMatch.length - 1]);
    }

    if (!intent.product_name && !intent.category && !intent.location) {
      return { 
        type: 'general', 
        conversational_response: "I'm not sure what you're looking for. Could you tell me the item name (like 'camera'), location, or your budget? I can find anything from electronics to accommodation!" 
      };
    }

    return intent;
  }

  /**
   * Scores products based on the 4-factor algorithm
   */
  private async scoreProducts(products: any[], intent: ChatIntent): Promise<ScoredProduct[]> {
    const scored = await Promise.all(products.map(async (product) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Location Match (30%)
      if (intent.location) {
        const productLoc = (product.district || product.sector || product.address_line || '').toLowerCase();
        if (productLoc.includes(intent.location.toLowerCase())) {
          score += 0.3;
          reasons.push('Location match');
        } else {
          score += 0.05; 
        }
      } else {
        score += 0.15; 
      }

      // 2. Budget Match (25%)
      if (intent.max_price && product.display_price) {
        if (product.display_price <= intent.max_price) {
          score += 0.25;
          reasons.push('Within budget');
        } else {
          const over = (product.display_price - intent.max_price) / intent.max_price;
          if (over < 0.2) {
            score += 0.1;
            reasons.push('Slightly over budget');
          }
        }
      } else {
        score += 0.125;
      }

      // 3. Owner Rating (20%)
      const rating = product.average_rating || 0;
      const ratingScore = (Math.min(rating, 5) / 5) * 0.2;
      score += ratingScore;
      if (rating >= 4) reasons.push('Highly rated owner');

      // 4. Availability (25%)
      score += 0.25; // Default for active products in MVP
      reasons.push('Available now');

      return {
        ...product,
        score: Math.round(score * 100),
        reasons
      };
    }));

    return scored.sort((a, b) => b.score - a.score);
  }

  private generateResponse(intent: ChatIntent, recommendations: ScoredProduct[]): string {
    if (recommendations.length === 0) {
      const searchTerms = [intent.product_name, intent.category].filter(Boolean).join(' or ');
      return `I couldn't find any exact matches for ${searchTerms || 'what you are looking for'} in ${intent.location || 'your area'}. Try adjusting your filters!`;
    }

    const first = recommendations[0];
    const categoryInfo = intent.category ? ` in the **${intent.category}** category` : '';
    return `I found some great options${categoryInfo}! The best match is the **${first.title}**, which fits your criteria perfectly.`;
  }
}

export default new AIChatbotService();
