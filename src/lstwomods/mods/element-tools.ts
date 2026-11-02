/**
 * Element Tools — hide things by selector, and a couple of blunt instruments for images.
 *
 * The selector field uses an apply button, the same way `ModSettingAttribute.ApplyButton`
 * defers a value until you commit it — you don't want a half-typed selector taking effect on
 * every keystroke.
 */
import { ROOT_SELECTOR, page } from '../core/dom';
import { defineMod } from '../core/mod';
import { Ref } from '../core/ref';

const hideSelector = new Ref('');
const hideImages = new Ref(false);
const roundness = new Ref(-1);
const borderEverything = new Ref(false);

/** Reject a selector the browser can't parse rather than writing broken CSS. */
function isValidSelector(selector: string) {
	if (selector.trim() === '') return false;
	try {
		document.querySelector(selector);
		return true;
	} catch {
		return false;
	}
}

function applyHideSelector() {
	const selector = hideSelector.value.trim();
	page.rule(
		'tools-hide',
		isValidSelector(selector) ? `${ROOT_SELECTOR} :is(${selector}) { display: none !important; }` : null
	);
}

function applyHideImages() {
	page.rule(
		'tools-hide-images',
		hideImages.value ? `${ROOT_SELECTOR} img, ${ROOT_SELECTOR} svg { visibility: hidden; }` : null
	);
}

function applyRoundness() {
	page.rule(
		'tools-roundness',
		roundness.value < 0 ? null : `${ROOT_SELECTOR} * { border-radius: ${roundness.value}px !important; }`
	);
}

function applyBorders() {
	page.rule(
		'tools-borders',
		borderEverything.value
			? `${ROOT_SELECTOR} div, ${ROOT_SELECTOR} section, ${ROOT_SELECTOR} p, ${ROOT_SELECTOR} a {
					border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
				}`
			: null
	);
}

export const elementToolsMod = defineMod({
	id: 'demo.tools',
	name: 'Element Tools',
	description: 'Hide elements by CSS selector and reshape what is left.',
	window: 'Element Mods',

	settings: [
		{
			type: 'string',
			key: 'hideSelector',
			label: 'Hide Selector',
			description: 'Any CSS selector, e.g. "nav a" or "footer". Applied when you press the button.',
			hint: 'e.g. footer, nav a, .text-branded',
			applyButton: true,
			applyButtonLabel: 'Hide Matching',
			order: 0,
			ref: hideSelector,
			onChange: applyHideSelector
		},
		{
			type: 'bool',
			key: 'hideImages',
			label: 'Hide Images',
			order: 10,
			ref: hideImages,
			onChange: applyHideImages
		},
		{
			type: 'float',
			key: 'roundness',
			label: 'Corner Radius',
			description: 'Below zero leaves the site’s own radii alone.',
			min: -1,
			max: 40,
			format: '%.0fpx',
			widget: 'slider',
			separatorText: 'Shape',
			order: 20,
			ref: roundness,
			onChange: applyRoundness
		},
		{
			type: 'bool',
			key: 'borderEverything',
			label: 'Border Everything',
			order: 30,
			ref: borderEverything,
			onChange: applyBorders
		}
	],

	actions: [
		{
			key: 'unhide',
			label: 'Unhide Everything',
			separatorText: 'Actions',
			order: 100,
			invoke() {
				hideSelector.value = '';
				hideImages.value = false;
			}
		}
	]
});
