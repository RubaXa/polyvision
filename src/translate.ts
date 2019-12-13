import { TranslationServiceClient } from '@google-cloud/translate';
import { PolyVision } from './setup';
import { Rect, Phrases, Phrase } from './vision';

export type TranslatedPhrases = Array<{
	locale: string;
	rect: Rect;
	parts: Array<{
		value: string;
		translatedValue: string;
		rect: Rect;
	}>;
}>;

let translationClient: any = null;

export function translate(client: PolyVision, phrases: Phrases): Promise<TranslatedPhrases>;
export function translate(client: PolyVision, key: string, phrases: Phrases): Promise<TranslatedPhrases>;
export function translate(
	client: PolyVision,
	keyOrPhrases: string | Phrases,
	phrases?: Phrases,
): Promise<TranslatedPhrases> {
	if (translationClient === null) {
		translationClient = new TranslationServiceClient();
	}

	const {
		cache,
		getTranslateOptions,
	} = client;
	const {
		projectId,
		location,
	} = getTranslateOptions();
	const key = phrases === undefined ? undefined : keyOrPhrases;
	const values = phrases === undefined ? keyOrPhrases as Phrases : phrases;

	const request = {
		parent: `projects/${projectId}/locations/${location}`,
		contents: values.map(pharseValue).map(normalizeText),
		mimeType: 'text/plain',
		sourceLanguageCode: 'en',
		targetLanguageCode: 'ru',
	};

	if (!request.contents.length) {
		return Promise.resolve(phrases as TranslatedPhrases);
	}

	return Promise.resolve()
		.then(() => key === undefined ? undefined : cache.get(`tr:${key}`))
		.then(cachedValue => {
			if (cachedValue !== undefined) {
				return cachedValue;
			}

			return translationClient.translateText(request);
		})
		.then(([{translations}]) => translations)
		.then(translations => translations.map(({translatedText}, i: number) => ({
			...values[i],
			translatedValue: translatedText,
		})))
	;
}

function normalizeText(val: string) {
	if (/^[A-Z\d\s.?!*-]+$/.test(val)) {
		return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
	}

	return val;
}

function pharseValue({parts}: Phrase) {
	return gluePharseParts(parts);
}

function gluePharseParts(parts) {
	return parts.map(({value}) => value).join(' ');
}