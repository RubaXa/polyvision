import { readFile, writeFile } from 'fs';
import { join as joinPath } from 'path';


export type Cache = {
	get: (key: string) => Promise<object | undefined>;
	set: <T extends object>(key: string, value: T) => Promise<T>;
}

export function createRuntimeCache(): Cache {
	const cache = {} as {[key:string]: object};

	return {
		get: (key: string) => Promise.resolve(cache[key]),
		set: <T extends object>(key: string, value: T) => {
			cache[key] = value;
			return Promise.resolve(value);
		},
	};
};

export function createFileStorageCache(cacheDir: string): Cache {
	const runtime = createRuntimeCache();
	const fileName = (key: string) => joinPath(cacheDir, `${key}.json`);

	return {
		get: (key: string) => runtime
			.get(key)
			.then(value => value !== undefined ? value : readJSON(fileName(key)))
		,

		set: <T extends object>(key: string, value: T) => runtime
			.set(key, value)
			.then(() => writeJSON(fileName(key), value) as T),
	};
}

function readJSON(file: string): Promise<object> {
	return new Promise((resolve, reject) => {
		readFile(file, (err, data) => {
			if (err) {
				resolve(undefined);
				return;
			}

			try {
				resolve(JSON.parse(data + ''));
			} catch (err) {
				reject(`Failed parse "${file}": ${err}`);
			}
		});
	});
}

function writeJSON(file: string, value: object): Promise<object> {
	return new Promise((resolve, reject) => {
		writeFile(file, JSON.stringify(value), (err) => {
			if (err) {
				reject(`Failed write "${file}": ${err}`);
				return;
			}

			resolve(value);
		});
	})
}