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

	private extractTranslatedText(data: any): string | undefined {
		if (!data) return undefined;
		if (typeof data === 'string') {
			const trimmed = data.trim();
			// Ignore HTML pages accidentally returned by provider mirrors
			if (/^<!DOCTYPE|^<html|^<head|^<body/i.test(trimmed)) return undefined;
			return trimmed;
		}
		// Common direct keys
		const direct = data.translatedText || data.translation || data.translated_text || data.result || data.output_text;
		if (typeof direct === 'string' && direct.trim()) return direct;
		// Array responses: pick first element recursively
		if (Array.isArray(data) && data.length > 0) {
			return this.extractTranslatedText(data[0]);
		}
		// Nested arrays/objects used by some providers
		if (Array.isArray(data?.translations) && data.translations.length > 0) {
			const first = data.translations[0];
			return (first?.text || first?.translatedText) as string | undefined;
		}
		if (Array.isArray(data?.data) && data.data.length > 0) {
			const first = data.data[0];
			return (first?.translatedText || first?.text) as string | undefined;
		}
		return undefined;
	}

	private isHtmlString(input: unknown): boolean {
		if (typeof input !== 'string') return false;
		const trimmed = input.trim();
		return /^<!DOCTYPE|^<html|^<head|^<body/i.test(trimmed);
	}

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

			const doRequest = async (endpoint: string) => axios.post(endpoint, payload, {
				timeout: 10000,
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			});

			let endpointToUse = this.endpoint;
			let res = await doRequest(endpointToUse);

			// If provider returned HTML, try to auto-correct by appending '/translate' once
			let contentType: string | undefined = (res?.headers?.['content-type'] || res?.headers?.['Content-Type']) as string | undefined;
			if (this.isHtmlString(res?.data) || (contentType && /text\/html/i.test(contentType))) {
				const endsWithTranslate = /\/?translate\/?$/i.test(endpointToUse);
				if (!endsWithTranslate) {
					const fallbackEndpoint = endpointToUse.replace(/\/+$/, '') + '/translate';
					res = await doRequest(fallbackEndpoint);
					contentType = (res?.headers?.['content-type'] || res?.headers?.['Content-Type']) as string | undefined;
					endpointToUse = fallbackEndpoint;
				}
			}

			if (this.isHtmlString(res?.data) || (contentType && /text\/html/i.test(contentType))) {
				return { success: false, error: 'Provider responded with HTML. Set TRANSLATE_API_URL to a JSON API endpoint (e.g., https://libretranslate.com/translate) or provide a valid API key.' };
			}

			const translated = this.extractTranslatedText(res?.data);
			if (!translated) {
				const raw = typeof res?.data === 'string' ? res.data : JSON.stringify(res?.data || {});
				return { success: false, error: `Provider returned no translation (raw: ${raw?.slice(0, 200)})` };
			}
			return { success: true, translated_text: translated, provider: 'libre' };
		} catch (err: any) {
			return { success: false, error: err?.message || 'Translation failed' };
		}
	}
}

export const translationProvider = new TranslationProvider();


