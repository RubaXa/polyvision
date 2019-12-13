
polyvision
----------
Text recognition and translation.

```sh
npm i --save polyvision
```

### How to use

```ts
import { readFileSync } from 'fs';
import { setup, recognize, translate } from 'polyvision';

const client = setup({
	vision: {
	},
	translate: {
		projectId: 'vision-XXXXXXXXXX',
		location: 'global',
	},
});

const file = readFileSync('./example.png');
const phrases = await recognize(client, file);
const translatedPhrases = await translate(client, phrases);

console.log(translatedPhrases);
```