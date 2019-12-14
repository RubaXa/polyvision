import { readFileSync } from 'fs';
import { setup, PolyVision } from '../src/setup';
import { recognize, Phrases } from '../src/vision';
import { translate } from '../src/translate';
import { createFileStorageCache } from '../src/cache';

const client = setup({
	vision: {},
	translate: {
		projectId: 'vision-261908',
		location: 'global',
	},
});
const clientWitCache = setup({
	cache: createFileStorageCache(__dirname),
	vision: client.getVisionOptions(),
	translate: client.getTranslateOptions(),
});

// Run tests
Promise.resolve()
	.then(() => {
		console.log('client without key')
		return test(client);
	})
	.then(() => {
		console.log('client with key')
		return test(client, 'tested');
	})
	.then(() => {
		console.log('client with key & cache')
		return test(clientWitCache, 'tested');
	})
	.then(() => {
		console.log('Done');
		process.exit(0);
	})
	.catch((err) => {
		console.log('Error:', err);
		process.exit(1);
	})
;

// Helpers
function recognizeTest(client: PolyVision, key?: string) {
	return (filename: string) => Promise.resolve()
		.then(() => readFileSync(filename))
		.then(buffer => recognize(client, key, buffer))
	;
}

function translateTest(client: PolyVision, key?: string) {
	return (phrases: Phrases) => Promise.resolve()
		.then(() => translate(client, key, phrases))
	;
}

function test(client: PolyVision, key?: string) {
	return Promise
		.resolve('/Users/k.lebedev/Downloads/item-4.jpg')
		.then(recognizeTest(client, key))
		.then(translateTest(client, key))
		.then((phrases) => {
			console.log(phrases);
		})
	;
}