
const STYLE_ELEMENT_ID = 'lstwomods-demo-styles';
const ROOT_ATTRIBUTE = 'data-lstwomods-page';

export const ROOT_SELECTOR = `[${ROOT_ATTRIBUTE}]`;

const rules = new Map<string, string>();
const variables = new Set<string>();
let styleElement: HTMLStyleElement | null = null;

function sheet(): HTMLStyleElement | null {
	if (typeof document === 'undefined') return null;
	if (styleElement?.isConnected) return styleElement;

	styleElement = document.createElement('style');
	styleElement.id = STYLE_ELEMENT_ID;
	document.head.appendChild(styleElement);
	return styleElement;
}

function flush() {
	const element = sheet();
	if (!element) return;
	element.textContent = [...rules.values()].join('\n');
}

export const page = {
	rule(id: string, css: string | null) {
		const next = css === '' ? null : css;
		if ((rules.get(id) ?? null) === next) return;

		if (next == null) rules.delete(id);
		else rules.set(id, next);
		flush();
	},

	variable(name: string, value: string | null) {
		if (typeof document === 'undefined') return;

		if (value == null) {
			document.documentElement.style.removeProperty(name);
			variables.delete(name);
		} else {
			document.documentElement.style.setProperty(name, value);
			variables.add(name);
		}
	},

	isOverlayNode(node: Element | null) {
		return node?.closest('[data-lstwomods-overlay]') != null;
	},

	root() {
		const element =
			document.querySelector('body > .page-layout') ??
			document.querySelector('body > div:not([data-lstwomods-overlay])');
		element?.setAttribute(ROOT_ATTRIBUTE, '');
		return ROOT_SELECTOR;
	},

	dispose() {
		rules.clear();
		for (const name of variables) document.documentElement?.style.removeProperty(name);
		variables.clear();
		styleElement?.remove();
		styleElement = null;
		document.querySelector(ROOT_SELECTOR)?.removeAttribute(ROOT_ATTRIBUTE);
	}
};

export function rgbToHex(rgb: readonly number[]) {
	const channel = (value: number) =>
		Math.round(Math.min(1, Math.max(0, value)) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${channel(rgb[0])}${channel(rgb[1])}${channel(rgb[2])}`;
}
