
import { ROOT_SELECTOR, page, rgbToHex } from '../core/dom';
import { defineMod, type Rgb } from '../core/mod';
import { Ref } from '../core/ref';

const outline = new Ref(false);
const outlineColor = new Ref<Rgb>([0.35, 0.85, 0.65]);
const depthTint = new Ref(true);
const hoverReadout = new Ref(false);

let readoutElement: HTMLElement | null = null;
let moveListener: ((event: PointerEvent) => void) | null = null;

function applyOutline() {
	if (!outline.value) {
		page.rule('inspector-outline', null);
		return;
	}

	const color = rgbToHex(outlineColor.value);
	const tint = depthTint.value
		? `${ROOT_SELECTOR} section, ${ROOT_SELECTOR} article, ${ROOT_SELECTOR} nav, ${ROOT_SELECTOR} footer {
				background-color: color-mix(in srgb, ${color} 6%, transparent);
			}`
		: '';

	page.rule(
		'inspector-outline',
		`${ROOT_SELECTOR} * { outline: 1px solid color-mix(in srgb, ${color} 45%, transparent); }
		 ${ROOT_SELECTOR} *:hover { outline: 1px solid ${color}; }
		 ${tint}`
	);
}

function describe(element: Element) {
	const id = element.id ? `#${element.id}` : '';
	const classes = [...element.classList]
		.slice(0, 3)
		.map((name) => `.${name}`)
		.join('');
	const rect = element.getBoundingClientRect();
	return `${element.tagName.toLowerCase()}${id}${classes}  ${Math.round(rect.width)}×${Math.round(rect.height)}`;
}

function applyReadout() {
	if (hoverReadout.value) {
		if (readoutElement) return;

		readoutElement = document.createElement('div');
		readoutElement.dataset.lstwomodsOverlay = '';
		readoutElement.className = 'lstwomods-inspector-readout';
		document.body.appendChild(readoutElement);

		page.rule(
			'inspector-readout',
			`.lstwomods-inspector-readout {
				position: fixed;
				z-index: 2147483002;
				pointer-events: none;
				padding: 4px 8px;
				border-radius: 6px;
				font: 12px/1.4 ui-monospace, monospace;
				color: #fff;
				background: rgb(0 0 0 / 0.82);
				border: 1px solid rgb(255 255 255 / 0.2);
				max-width: 60ch;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}`
		);

		moveListener = (event) => {
			if (!readoutElement) return;

			const target = document.elementFromPoint(event.clientX, event.clientY);
			if (!target || page.isOverlayNode(target)) {
				readoutElement.style.opacity = '0';
				return;
			}

			readoutElement.style.opacity = '1';
			readoutElement.textContent = describe(target);
			readoutElement.style.left = `${Math.min(event.clientX + 14, window.innerWidth - 320)}px`;
			readoutElement.style.top = `${event.clientY + 18}px`;
		};

		window.addEventListener('pointermove', moveListener, { passive: true });
		return;
	}

	if (moveListener) window.removeEventListener('pointermove', moveListener);
	moveListener = null;
	readoutElement?.remove();
	readoutElement = null;
	page.rule('inspector-readout', null);
}

export const inspectorMod = defineMod({
	id: 'demo.inspector',
	name: 'Element Inspector',
	description: 'Outlines the page and reports what is under the cursor.',
	window: 'Element Mods',

	settings: [
		{
			type: 'bool',
			key: 'outline',
			label: 'Outline Everything',
			order: 0,
			ref: outline,
			onChange: applyOutline
		},
		{
			type: 'color3',
			key: 'outlineColor',
			label: 'Outline Color',
			order: 10,
			ref: outlineColor,
			onChange: applyOutline
		},
		{
			type: 'bool',
			key: 'depthTint',
			label: 'Tint Sections',
			description: 'Shades the big layout containers so nesting is easier to read.',
			order: 20,
			ref: depthTint,
			onChange: applyOutline
		},
		{
			type: 'bool',
			key: 'hoverReadout',
			label: 'Hover Readout',
			description: 'Follows the cursor with the tag, id, classes and size of the element under it.',
			order: 30,
			ref: hoverReadout,
			onChange: applyReadout
		}
	],

	dispose() {
		hoverReadout.value = false;
		applyReadout();
	}
});
