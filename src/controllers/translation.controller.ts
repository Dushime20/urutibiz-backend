import { Request, Response } from 'express';
import { translationProvider } from '../services/localization/TranslationProvider';

export class TranslationController {
	async translate(req: Request, res: Response): Promise<void> {
		try {
			const { text, source_lang, target_lang } = req.body || {};
			if (!text || !target_lang) {
				res.status(400).json({ success: false, message: 'text and target_lang are required' });
				return;
			}
			const result = await translationProvider.translate({ text, source_lang, target_lang });
			if (!result.success) {
				res.status(400).json({ success: false, message: result.error || 'Translation failed' });
				return;
			}
			res.status(200).json({ success: true, data: { translated_text: result.translated_text, provider: result.provider } });
		} catch (error: any) {
			res.status(500).json({ success: false, message: error?.message || 'Failed to translate' });
		}
	}
}

export const translationController = new TranslationController();


