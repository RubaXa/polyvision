import { ImageAnnotatorClient } from '@google-cloud/vision';
import { PolyVision } from './setup';

let imageAnnotatorClient = null as any;

export type PhrasePart = {
	value: string;
	rect: Rect;
};

export type Phrase = {
	locale: string;
	rect: Rect;
	parts: PhrasePart[];
};

export type Phrases = Phrase[];

export type Rect = {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
};

export async function recognize(client: PolyVision, file: Buffer): Promise<Phrases>;
export async function recognize(client: PolyVision, key: string, file: Buffer): Promise<Phrases>;
export async function recognize(client: PolyVision, keyOrBuffer: string | Buffer, file?: Buffer): Promise<Phrases> {
	if (imageAnnotatorClient === null) {
		imageAnnotatorClient = new ImageAnnotatorClient();
	}

	const { cache } = client;
	const key = keyOrBuffer instanceof Buffer ? undefined : keyOrBuffer;
	const blob = keyOrBuffer instanceof Buffer ? keyOrBuffer : file!;

	return Promise.resolve()
		.then(() => key === undefined ? undefined : cache.get(`vision:${key}`))
		.then((cachedValue) => {
			if (cachedValue !== undefined) {
				return cachedValue;
			}

			return imageAnnotatorClient.textDetection(blob);
		})
		.then(([result]) => result)
		.then((result) => {
			const detections = result.textAnnotations;
			const phrases = detections.slice(1).reduce(reducePhrases, []);
			return phrases;
		})
		.then((phrases) => key === undefined ? phrases : cache.set(`vision:${key}`, phrases))
	;
}

function mergePhrases(phrases, {locale, rect, value}) {
	const next = {
		locale,
		rect: {...rect},
		parts: [{value, rect}],
	};
	let prev = phrases[phrases.length - 1];

	if (prev === undefined) {
		prev = next;
		phrases.push(prev);
		return;
	}

	if (prev.locale !== locale) {
		phrases.push(next);
		return;
	}

	if (isSibling(prev, rect, value)) {
		prev.parts.push({value, rect});
		unionRect(prev.rect, rect);
		return;
	}

	phrases.push(next);
}

function isSibling(phrase, next, value) {
	// const nw = next.x2 - next.x1;
	const nh = next.y2 - next.y1;

	// Проверяем что это рядом стоящее слово
	{
		const prev = phrase.parts[phrase.parts.length - 1].rect;
		const ph = prev.y2 - prev.y1;
		const oh = Math.abs(next.y1 - prev.y1) / Math.min(ph, nh);

		// console.log(value, [oh, ph, nh], [prev, next]);
		if (oh < 0.5) {
			return true;
		}
	}

	// Проверяем, что это просто слово с новой строчки
	{
		const first = phrase.parts[0];
		const rect = phrase.rect;
		const fh = first.rect.y2 - first.rect.y1;
		const oh = Math.abs(next.y1 - rect.y2)  / Math.min(fh, nh);;

		if (oh < 0.6 && (next.x2 > rect.x1 || (rect.x1 - next.x2) < (rect.x2 - rect.x1)/2)) {
			return true;
		}
		// console.log(value, oh, [fh, nh]);
	}

	// Пересечение
	{
		if (intersectRect(phrase.rect, next)) {
			return true;
		}
	}

	// console.log(value, [oh, ph, nh], [prev, next]);
	return false;
}

function reducePhrases(phrases, token) {
	mergePhrases(phrases, {
		value: token.description,
		locale: token.locale || 'en',
		rect: token.boundingPoly.vertices.reduce(reduceTokenRect, {}),
	});

	return phrases;
}

function reduceTokenRect(rect, {x, y}) {
	rect.x1 = rect.x1 === undefined ? x : Math.min(x, rect.x1);
	rect.y1 = rect.y1 === undefined ? y : Math.min(y, rect.y1);

	rect.x2 = rect.x2 === undefined ? x : Math.max(x, rect.x2);
	rect.y2 = rect.y2 === undefined ? x : Math.max(y, rect.y2);

	return rect;
}

function unionRect(rect, otherRect) {
	rect.x1 = Math.min(rect.x1, otherRect.x1);
	rect.y1 = Math.min(rect.y1, otherRect.y1);

	rect.x2 = Math.max(rect.x2, otherRect.x2);
	rect.y2 = Math.max(rect.y2, otherRect.y2);
}

function intersectRect(r1, r2) {
	return !(r2.x1 > r1.x2 || r2.x2 < r1.x1 || r2.y1 > r1.y2 || r2.y2 < r1.y1);
}