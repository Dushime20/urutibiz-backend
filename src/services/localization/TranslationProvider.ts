import axios from 'axios';

export interface TranslateParams {
	text: string;
	source_lang?: string; // e.g., 'en'
	target_lang: string;  // e.g., 'fr'
}

export interface TranslateResult {
	success: boolean;
	translated_text?: string;
	provider?: string;
	error?: string;
}

/**
 * Simple translation provider using LibreTranslate compatible API.
 * Configure endpoint and API key via env vars.
 */
export class TranslationProvider {
	private endpoint: string;
	private apiKey?: string;

	constructor() {
		this.endpoint = process.env.TRANSLATE_API_URL || 'https://libretranslate.de/translate';
		this.apiKey = process.env.TRANSLATE_API_KEY;
	}

	async translate(params: TranslateParams): Promise<TranslateResult> {
		try {
			if (!params?.text || !params?.target_lang) {
				return { success: false, error: 'text and target_lang are required' };
			}
			const payload: any = {
				q: params.text,
				source: params.source_lang || 'auto',
				target: params.target_lang,
				format: 'text',
			};
			if (this.apiKey) payload.api_key = this.apiKey;

			const res = await axios.post(this.endpoint, payload, { timeout: 10000 });
			const translated = res?.data?.translatedText || res?.data?.translation || res?.data?.translated_text;
			if (!translated) {
				return { success: false, error: 'Provider returned no translation' };
			}
			return { success: true, translated_text: translated, provider: 'libre' };
		} catch (err: any) {
			return { success: false, error: err?.message || 'Translation failed' };
		}
	}
}

export const translationProvider = new TranslationProvider();


