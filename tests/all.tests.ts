import { readFileSync } from 'fs';
import { setup } from '../src/setup';
import { recognize, Phrases } from '../src/vision';
import { translate } from '../src/translate';

const client = setup({
	vision: {},
	translate: {
		projectId: 'vision-261908',
		location: 'global',
	},
});

function recognizeTest(filename: string) {
	return Promise.resolve()
		.then(() => readFileSync(filename))
		.then(buffer => recognize(client, buffer))
	;
}

function translateTest(phrases: Phrases) {
	return Promise.resolve()
		.then(() => translate(client, phrases))
	;
}

Promise
	.resolve('~/Downloads/item-4.jpg')
	.then(recognizeTest)
	.then(translateTest)
	.then((phrases) => {
		console.log(phrases);
		process.exit(0);
	})
	.catch((err) => {
		console.log('Error:', err);
		process.exit(1);
	})
;