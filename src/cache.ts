
export type Cache = {
	get: (key: string) => Promise<object | undefined>;
	set: (key: string, value: Buffer) => Promise<void>;
}

export function createRuntimeCache(): Cache {
	const cache = {} as {[key:string]: object};

	return {
		get: async (key: string) => cache[key],
		set: async (key: string, value: object) => {
			cache[key] = value;
		},
	};
};