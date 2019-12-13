import { Cache, createRuntimeCache } from './cache';

export type InitOptions = {
	cache?: Cache;
	vision: {};
	translate: {
		projectId: string;
		location: string;
	};
};

export type PolyVision = {
	readonly cache: Cache;
	getVisionOptions(): InitOptions['vision'];
	getTranslateOptions(): InitOptions['translate'];
};

export function setup(init: InitOptions): PolyVision {
	const {
		cache = createRuntimeCache(),
		vision,
		translate,
	} = init;

	return {
		cache,
		getVisionOptions: () => vision,
		getTranslateOptions: () => translate,
	};
}