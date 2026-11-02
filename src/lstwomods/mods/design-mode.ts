
import { ROOT_SELECTOR, page, rgbToHex } from '../core/dom';
import { defineMod, type Rgb } from '../core/mod';
import { Ref } from '../core/ref';

const enabled = new Ref(false);
const highlight = new Ref(true);
const highlightColor = new Ref<Rgb>([0.55, 0.35, 0.95]);
const spellcheck = new Ref(false);

function applyHighlight() {
	const on = enabled.value && highlight.value;
	page.rule(
		'design-mode-highlight',
		on
			? `${ROOT_SELECTOR} p, ${ROOT_SELECTOR} h1, ${ROOT_SELECTOR} h2, ${ROOT_SELECTOR} h3,
			   ${ROOT_SELECTOR} h4, ${ROOT_SELECTOR} li, ${ROOT_SELECTOR} span, ${ROOT_SELECTOR} a {
				outline: 1px dashed ${rgbToHex(highlightColor.value)};
				outline-offset: 2px;
			}`
			: null
	);
}

export const designModeMod = defineMod({
	id: 'demo.design-mode',
	name: 'Design Mode',
	description: 'Makes every bit of text on the site editable, straight in the browser.',
	window: 'Page Mods',

	settings: [
		{
			type: 'bool',
			key: 'enabled',
			label: 'Design Mode',
			description: 'Turns on document.designMode — click any text and start typing.',
			order: 0,
			ref: enabled,
			onChange(value) {
				document.designMode = value ? 'on' : 'off';
				applyHighlight();
			}
		},
		{
			type: 'bool',
			key: 'highlight',
			label: 'Outline Editable Text',
			description: 'Dashed outline around everything you can edit.',
			order: 10,
			ref: highlight,
			onChange: applyHighlight
		},
		{
			type: 'color3',
			key: 'highlightColor',
			label: 'Outline Color',
			order: 20,
			ref: highlightColor,
			onChange: applyHighlight
		},
		{
			type: 'bool',
			key: 'spellcheck',
			label: 'Spellcheck While Editing',
			order: 30,
			ref: spellcheck,
			onChange(value) {
				document.documentElement.spellcheck = value;
			}
		}
	],

	actions: [],

	dispose() {
		document.designMode = 'off';
		document.documentElement.spellcheck = false;
	}
});
