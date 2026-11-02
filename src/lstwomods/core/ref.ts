
export type RefListener<T> = (value: T) => void;

function same(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => v === b[i]);
	}
	return false;
}

export class Ref<T> {
	#value: T;
	#listeners = new Set<RefListener<T>>();

	constructor(value: T) {
		this.#value = value;
	}

	get value(): T {
		return this.#value;
	}

	set value(next: T) {
		if (same(this.#value, next)) return;
		this.#value = next;
		this.emit();
	}

	subscribe(listener: RefListener<T>): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	emit() {
		for (const listener of this.#listeners) {
			try {
				listener(this.#value);
			} catch (error) {
				console.error('[lstwoMODS demo] Ref listener threw', error);
			}
		}
	}
}

