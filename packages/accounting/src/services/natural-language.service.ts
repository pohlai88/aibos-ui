/**
 * Natural Language Service - Phase 2 Scaffold
 *
 * This service provides natural language processing capabilities
 * for converting text descriptions into structured accounting data.
 *
 * TODO: Implement actual NLP integration in Phase 2
 */

export interface NaturalLanguageService {
  /**
   * Parse natural language descriptions into structured accounting data
   */
  parseDescription(description: string): Promise<{
    account: string | null;
    category: string | null;
    amount: number | null;
    confidence: number;
  }>;

  /**
   * Extract entities from accounting text (accounts, amounts, dates, etc.)
   */
  extractEntities(text: string): Promise<{
    entities: {
      type: 'account' | 'amount' | 'date' | 'category';
      value: string;
      confidence: number;
    }[];
  }>;

  /**
   * Convert structured data back to natural language
   */
  generateDescription(data: {
    account: string;
    amount: number;
    category?: string;
  }): Promise<{ description: string }>;

  /**
   * Validate natural language input for accounting compliance
   */
  validateInput(input: string): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }>;
}

export const naturalLanguageService: NaturalLanguageService = {
  async parseDescription(_description) {
    // TODO: Implement NLP-powered description parsing
    return { account: null, category: null, amount: null, confidence: 0 };
  },

  async extractEntities(_text) {
    // TODO: Implement NLP-powered entity extraction
    return { entities: [] };
  },

  async generateDescription(_data) {
    // TODO: Implement NLP-powered description generation
    return { description: 'Generated description not yet implemented' };
  },

  async validateInput(_input) {
    // TODO: Implement NLP-powered input validation
    return { isValid: false, errors: ['NLP validation not yet implemented'], suggestions: [] };
  },
};
