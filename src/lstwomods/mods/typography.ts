
import { ROOT_SELECTOR, page } from '../core/dom';
import { defineMod } from '../core/mod';
import { Ref } from '../core/ref';

const FONT_STACKS = [
	'',
	'Georgia, "Times New Roman", serif',
	'ui-monospace, "Cascadia Code", "Courier New", monospace',
	'"Comic Sans MS", "Comic Neue", cursive',
	'"Brush Script MT", cursive',
	'Impact, "Haettenschweiler", sans-serif'
];

const FONT_NAMES = ['Site Default', 'Serif', 'Monospace', 'Comic Sans', 'Handwriting', 'Impact'];

const rootSize = new Ref(16);
const fontIndex = new Ref(0);
const letterSpacing = new Ref(0);
const lineHeight = new Ref(1);

function applyRootSize() {
	page.rule(
		'typography-root',
		rootSize.value === 16 ? null : `html { font-size: ${rootSize.value}px; }`
	);
}

function applyFont() {
	const stack = FONT_STACKS[fontIndex.value] ?? '';
	page.rule(
		'typography-font',
		stack === '' ? null : `${ROOT_SELECTOR}, ${ROOT_SELECTOR} * { font-family: ${stack} !important; }`
	);
}

function applyText() {
	const declarations = [
		letterSpacing.value !== 0 ? `letter-spacing: ${letterSpacing.value}px;` : '',
		lineHeight.value !== 1 ? `line-height: ${lineHeight.value};` : ''
	]
		.filter(Boolean)
		.join(' ');

	page.rule(
		'typography-text',
		declarations === '' ? null : `${ROOT_SELECTOR} { ${declarations} }`
	);
}

export const typographyMod = defineMod({
	id: 'demo.typography',
	name: 'Typography',
	description: 'Font, size and spacing for every bit of text on the page.',
	window: 'Page Mods',

	settings: [
		{
			type: 'float',
			key: 'rootSize',
			label: 'Root Font Size',
			description: 'Everything on the site is sized in rem, so this rescales the whole layout.',
			min: 8,
			max: 28,
			format: '%.0fpx',
			widget: 'slider',
			order: 0,
			ref: rootSize,
			onChange: applyRootSize
		},
		{
			type: 'enum',
			key: 'font',
			label: 'Font',
			options: FONT_NAMES,
			order: 10,
			ref: fontIndex,
			onChange: applyFont
		},
		{
			type: 'float',
			key: 'letterSpacing',
			label: 'Letter Spacing',
			min: -2,
			max: 8,
			format: '%.1fpx',
			order: 20,
			ref: letterSpacing,
			onChange: applyText
		},
		{
			type: 'float',
			key: 'lineHeight',
			label: 'Line Height',
			min: 0.6,
			max: 3,
			order: 30,
			ref: lineHeight,
			onChange: applyText
		}
	],

	actions: [
		{
			key: 'reset',
			label: 'Reset Typography',
			separatorText: 'Actions',
			order: 100,
			invoke: () => typographyMod.reset()
		}
	]
});
