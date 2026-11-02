
const PREFIX = 'lstwomods-demo';

function storage(): Storage | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage;
}

function fullKey(id: string, key: string) {
	return `${PREFIX}/${id}/${key}`;
}

export const DataStorage = {
	load<T>(id: string, key: string, fallback: T): T {
		const raw = storage()?.getItem(fullKey(id, key));
		if (raw == null) return fallback;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return fallback;
		}
	},

	save<T>(id: string, key: string, value: T) {
		try {
			storage()?.setItem(fullKey(id, key), JSON.stringify(value));
		} catch (error) {
			console.warn('[lstwoMODS demo] failed to persist', fullKey(id, key), error);
		}
	},

	delete(id: string, key: string) {
		storage()?.removeItem(fullKey(id, key));
	},

	keys(id: string): string[] {
		const store = storage();
		if (!store) return [];

		const prefix = `${PREFIX}/${id}/`;
		const found: string[] = [];

		for (let i = 0; i < store.length; i++) {
			const key = store.key(i);
			if (key?.startsWith(prefix)) found.push(key.slice(prefix.length));
		}

		return found.sort();
	}
};
