
import { ImGui, ImGuiColorEditFlags, ImGuiTreeNodeFlags, ImGuiWindowFlags } from '@mori2003/jsimgui';
import {
	BUILT_IN_NAMES,
	COLOR_COUNT,
	COLOR_NAMES,
	STYLE_VAR_COUNT,
	STYLE_VAR_NAMES,
	VEC2_STYLE_VARS,
	applySimpleToPreset,
	applyStyleVars,
	captureBuiltIn,
	clonePreset,
	customPresetNames,
	deletePreset,
	deriveSimpleFromPreset,
	floatRange,
	getColor,
	loadPreset,
	loadSelectedName,
	savePreset,
	saveSelectedName,
	setColor,
	vec2Range,
	type StylePreset
} from './style';
import {
	checkbox,
	colorEdit3,
	colorEdit4,
	combo,
	dragFloat,
	dragFloat2,
	inputText,
	tooltip
} from './widgets';

const DUPLICATE_POPUP = 'Name Already Exists';

class StyleEditorState {
	preset: StylePreset;
	presetNames: string[] = [];
	selectedIndex = 0;
	saveAsName = '';
	simpleMode = false;

	onStyleChanged: ((preset: StylePreset) => void) | null = null;

	constructor() {
		this.preset = captureBuiltIn(0);
		this.refreshPresetList();
	}

	get currentCustomIndex() {
		return this.selectedIndex >= BUILT_IN_NAMES.length
			? this.selectedIndex - BUILT_IN_NAMES.length
			: -1;
	}

	get customNames() {
		return this.presetNames.slice(BUILT_IN_NAMES.length);
	}

	refreshPresetList() {
		this.presetNames = [...BUILT_IN_NAMES, ...customPresetNames()];
	}

	restoreSelection() {
		const saved = loadSelectedName();
		const index = saved ? this.presetNames.indexOf(saved) : -1;
		this.select(index >= 0 ? index : 0);
	}

	select(index: number) {
		this.selectedIndex = Math.min(Math.max(index, 0), this.presetNames.length - 1);
		saveSelectedName(this.presetNames[this.selectedIndex]);

		const customIndex = this.currentCustomIndex;
		this.saveAsName = customIndex >= 0 ? this.customNames[customIndex] : '';

		if (customIndex < 0) {
			this.preset = captureBuiltIn(this.selectedIndex);
		} else {
			this.preset = loadPreset(this.customNames[customIndex]) ?? captureBuiltIn(0);
		}

		this.fireChanged();
	}

	fireChanged() {
		applyStyleVars(this.preset);
		this.onStyleChanged?.(this.preset);
	}

	applySimpleEdit() {
		applySimpleToPreset(this.preset);
		this.fireChanged();
	}

	get simple() {
		this.preset.simple ??= deriveSimpleFromPreset(this.preset);
		return this.preset.simple;
	}
}

let state: StyleEditorState | null = null;

export function initStyleEditor(onStyleChanged: (preset: StylePreset) => void) {
	state = new StyleEditorState();
	state.onStyleChanged = onStyleChanged;
	state.restoreSelection();
	return state;
}

export function currentPreset() {
	return state?.preset ?? null;
}

export function disposeStyleEditor() {
	state = null;
}

function drawPresetBar(editor: StyleEditorState) {
	const selected = combo('Presets###style-combo', editor.selectedIndex, editor.presetNames);
	if (selected != null) editor.select(selected);

	const isCustom = editor.currentCustomIndex >= 0;

	ImGui.SetNextItemWidth(ImGui.CalcItemWidth() * 0.6);
	const typed = inputText('###style-saveas', editor.saveAsName, 'Preset name...', 64);
	if (typed != null) editor.saveAsName = typed;

	const name = editor.saveAsName.trim();
	const nameIsUsable = name !== '' && !BUILT_IN_NAMES.some((builtIn) => builtIn.toLowerCase() === name.toLowerCase());

	ImGui.SameLine();
	if (!isCustom) ImGui.BeginDisabled(true);
	if (ImGui.Button('Save###style-save') && nameIsUsable) {
		const oldName = editor.customNames[editor.currentCustomIndex];
		if (oldName && oldName !== name) deletePreset(oldName);

		savePreset(name, editor.preset);
		editor.refreshPresetList();
		editor.selectedIndex = Math.max(editor.presetNames.indexOf(name), 0);
		saveSelectedName(name);
	}
	if (!isCustom) ImGui.EndDisabled();
	tooltip('Save changes to the selected custom preset.');

	ImGui.SameLine();
	if (ImGui.Button('New###style-new') && nameIsUsable) {
		if (customPresetNames().includes(name)) {
			ImGui.OpenPopup(DUPLICATE_POPUP);
		} else {
			savePreset(name, clonePreset(editor.preset));
			editor.refreshPresetList();
			editor.select(editor.presetNames.indexOf(name));
		}
	}
	tooltip('Save the current style as a new custom preset.');

	ImGui.SameLine();
	if (!isCustom) ImGui.BeginDisabled(true);
	if (ImGui.Button('Delete###style-del') && isCustom) {
		deletePreset(editor.customNames[editor.currentCustomIndex]);
		editor.refreshPresetList();
		editor.select(0);
	}
	if (!isCustom) ImGui.EndDisabled();
	if (!isCustom) tooltip('Built-in themes cannot be deleted — save a copy with New first.');

	if (ImGui.BeginPopupModal(DUPLICATE_POPUP, null, ImGuiWindowFlags.AlwaysAutoResize)) {
		ImGui.TextWrapped('A preset with that name already exists. Please choose a different name.');
		if (ImGui.Button('OK###style-dup-ok')) ImGui.CloseCurrentPopup();
		ImGui.EndPopup();
	}
}

function drawSimpleMode(editor: StyleEditorState) {
	const simple = editor.simple;

	ImGui.SeparatorText('Base Colors');

	const accent = colorEdit3('Accent###s-accent', simple.accent);
	if (accent) {
		simple.accent = accent;
		editor.applySimpleEdit();
	}
	tooltip('Buttons, checkmarks, sliders, selected tabs and other highlights.');

	const background = colorEdit3('Background###s-bg', simple.background);
	if (background) {
		simple.background = background;
		editor.applySimpleEdit();
	}
	tooltip('Window background. Frames, title bars and popups are derived from it.');

	const text = colorEdit3('Text###s-text', simple.text);
	if (text) {
		simple.text = text;
		editor.applySimpleEdit();
	}

	const border = colorEdit3('Border###s-border', simple.border);
	if (border) {
		simple.border = border;
		editor.applySimpleEdit();
	}

	ImGui.SeparatorText('Sizes');

	const rounding = dragFloat('Rounding###s-round', simple.rounding, 0.1, 0, 12, '%.1f');
	if (rounding != null) {
		simple.rounding = rounding;
		editor.applySimpleEdit();
	}
	tooltip('Corner rounding for windows, frames, scrollbars, grabs and tabs.');

	const borderSize = dragFloat('Border Size###s-bordersize', simple.borderSize, 0.05, 0, 3, '%.2f');
	if (borderSize != null) {
		simple.borderSize = borderSize;
		editor.applySimpleEdit();
	}
	tooltip('Border thickness for windows, frames, popups and tabs.');

	const spacing = dragFloat('Spacing###s-spacing', simple.spacing, 0.1, 0, 20, '%.1f');
	if (spacing != null) {
		simple.spacing = spacing;
		editor.applySimpleEdit();
	}
	tooltip('Base padding and spacing between and inside widgets.');
}

function drawAdvancedMode(editor: StyleEditorState) {
	if (ImGui.CollapsingHeader('Colors###style-colors', ImGuiTreeNodeFlags.DefaultOpen)) {
		for (let i = 0; i < COLOR_COUNT; i++) {
			const next = colorEdit4(
				`${COLOR_NAMES[i]}###style-col-${i}`,
				getColor(editor.preset, i),
				ImGuiColorEditFlags.AlphaBar
			);
			if (next) {
				setColor(editor.preset, i, next);
				editor.preset.simple = undefined;
				editor.fireChanged();
			}
		}
	}

	if (ImGui.CollapsingHeader('Style Variables###style-vars')) {
		for (let i = 0; i < STYLE_VAR_COUNT; i++) {
			const label = `${STYLE_VAR_NAMES[i]}###style-var-${i}`;

			if (VEC2_STYLE_VARS.has(i)) {
				const [min, max] = vec2Range(i);
				const next = dragFloat2(
					label,
					editor.preset.styleVarValues[i],
					editor.preset.styleVarValuesY[i],
					0.1,
					min,
					max
				);
				if (next) {
					editor.preset.styleVarValues[i] = next[0];
					editor.preset.styleVarValuesY[i] = next[1];
					editor.fireChanged();
				}
			} else {
				const [min, max] = floatRange(i);
				const next = dragFloat(label, editor.preset.styleVarValues[i], 0.05, min, max, '%.2f');
				if (next != null) {
					editor.preset.styleVarValues[i] = next;
					editor.fireChanged();
				}
			}
		}
	}
}

export function drawStyleEditorWindow() {
	if (!state) {
		ImGui.TextDisabled('Style editor not ready.');
		return;
	}

	drawPresetBar(state);
	ImGui.SeparatorText('');

	const simple = checkbox('Simple Mode###style-simple', state.simpleMode);
	if (simple != null) state.simpleMode = simple;
	tooltip('Set a few base colors and sizes; the rest of the theme is generated for you.');

	if (state.simpleMode) drawSimpleMode(state);
	else drawAdvancedMode(state);
}
