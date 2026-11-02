
import { ImGui, ImGuiCol, ImGuiStyleVar, ImVec2, ImVec4 } from '@mori2003/jsimgui';
import { DataStorage } from '../core/storage';

export const COLOR_COUNT = ImGuiCol.COUNT;
export const STYLE_VAR_COUNT = ImGuiStyleVar.COUNT;

export const VEC2_STYLE_VARS = new Set<number>([
	ImGuiStyleVar.WindowPadding,
	ImGuiStyleVar.WindowMinSize,
	ImGuiStyleVar.WindowTitleAlign,
	ImGuiStyleVar.FramePadding,
	ImGuiStyleVar.ItemSpacing,
	ImGuiStyleVar.ItemInnerSpacing,
	ImGuiStyleVar.CellPadding,
	ImGuiStyleVar.TableAngledHeadersTextAlign,
	ImGuiStyleVar.ButtonTextAlign,
	ImGuiStyleVar.SelectableTextAlign,
	ImGuiStyleVar.SeparatorTextAlign,
	ImGuiStyleVar.SeparatorTextPadding
]);

export const COLOR_NAMES: string[] = Object.entries(ImGuiCol)
	.filter(([name]) => name !== 'COUNT')
	.sort(([, a], [, b]) => (a as number) - (b as number))
	.map(([name]) => name);

export const STYLE_VAR_NAMES: string[] = Object.entries(ImGuiStyleVar)
	.filter(([name]) => name !== 'COUNT')
	.sort(([, a], [, b]) => (a as number) - (b as number))
	.map(([name]) => name);

export interface SimpleStyleParams {
	accent: [number, number, number];
	background: [number, number, number];
	text: [number, number, number];
	border: [number, number, number];
	rounding: number;
	borderSize: number;
	spacing: number;
}

export interface StylePreset {
	colors: number[];
	styleVarValues: number[];
	styleVarValuesY: number[];
	simple?: SimpleStyleParams;
}

export const BUILT_IN_NAMES = ['Dark', 'Light', 'Classic'] as const;

const STORAGE_ID = 'styles';
const SELECTED_KEY = '_selected';

// ── capture / apply ──────────────────────────────────────────────────────────

function captureStyle(): StylePreset {
	const style = ImGui.GetStyle();
	const colors = new Array<number>(COLOR_COUNT * 4).fill(0);
	const liveColors = style.Colors;

	for (let i = 0; i < COLOR_COUNT; i++) {
		const color = liveColors[i];
		colors[i * 4] = color.x;
		colors[i * 4 + 1] = color.y;
		colors[i * 4 + 2] = color.z;
		colors[i * 4 + 3] = color.w;
	}

	const styleVarValues = new Array<number>(STYLE_VAR_COUNT).fill(0);
	const styleVarValuesY = new Array<number>(STYLE_VAR_COUNT).fill(0);

	for (let i = 0; i < STYLE_VAR_COUNT; i++) {
		const name = STYLE_VAR_NAMES[i];
		const value = (style as unknown as Record<string, unknown>)[name];
		if (value instanceof ImVec2) {
			styleVarValues[i] = value.x;
			styleVarValuesY[i] = value.y;
		} else if (typeof value === 'number') {
			styleVarValues[i] = value;
		}
	}

	return { colors, styleVarValues, styleVarValuesY };
}

export function captureBuiltIn(index: number): StylePreset {
	const style = ImGui.GetStyle();
	if (index === 1) ImGui.StyleColorsLight(style);
	else if (index === 2) ImGui.StyleColorsClassic(style);
	else ImGui.StyleColorsDark(style);

	return captureStyle();
}

export function applyStyleVars(preset: StylePreset) {
	const style = ImGui.GetStyle() as unknown as Record<string, unknown>;

	for (let i = 0; i < STYLE_VAR_COUNT; i++) {
		const name = STYLE_VAR_NAMES[i];
		if (!(name in style)) continue;

		if (VEC2_STYLE_VARS.has(i)) {
			style[name] = new ImVec2(preset.styleVarValues[i], preset.styleVarValuesY[i]);
		} else {
			style[name] = preset.styleVarValues[i];
		}
	}
}

export function presetColorVectors(preset: StylePreset): ImVec4[] {
	return Array.from(
		{ length: COLOR_COUNT },
		(_, i) =>
			new ImVec4(
				preset.colors[i * 4],
				preset.colors[i * 4 + 1],
				preset.colors[i * 4 + 2],
				preset.colors[i * 4 + 3]
			)
	);
}

export function pushPresetColors(colors: readonly ImVec4[]) {
	for (let i = 0; i < colors.length; i++) ImGui.PushStyleColorImVec4(i, colors[i]);
	return colors.length;
}

export function getColor(preset: StylePreset, col: number): [number, number, number, number] {
	return [
		preset.colors[col * 4],
		preset.colors[col * 4 + 1],
		preset.colors[col * 4 + 2],
		preset.colors[col * 4 + 3]
	];
}

export function setColor(preset: StylePreset, col: number, value: readonly number[]) {
	preset.colors[col * 4] = value[0];
	preset.colors[col * 4 + 1] = value[1];
	preset.colors[col * 4 + 2] = value[2];
	preset.colors[col * 4 + 3] = value[3] ?? 1;
}

// ── simple mode ──────────────────────────────────────────────────────────────

const ROUNDING_VARS = [
	ImGuiStyleVar.WindowRounding,
	ImGuiStyleVar.ChildRounding,
	ImGuiStyleVar.PopupRounding,
	ImGuiStyleVar.FrameRounding,
	ImGuiStyleVar.ScrollbarRounding,
	ImGuiStyleVar.GrabRounding,
	ImGuiStyleVar.TabRounding,
	ImGuiStyleVar.TreeLinesRounding
];

const BORDER_VARS = [
	ImGuiStyleVar.WindowBorderSize,
	ImGuiStyleVar.ChildBorderSize,
	ImGuiStyleVar.PopupBorderSize,
	ImGuiStyleVar.FrameBorderSize,
	ImGuiStyleVar.TabBorderSize,
	ImGuiStyleVar.SeparatorTextBorderSize
];

type Color = [number, number, number, number];

function color(rgb: readonly number[], alpha = 1): Color {
	return [rgb[0], rgb[1], rgb[2], alpha];
}

function lerp(a: Color, b: Color, t: number): Color {
	return [
		a[0] + (b[0] - a[0]) * t,
		a[1] + (b[1] - a[1]) * t,
		a[2] + (b[2] - a[2]) * t,
		a[3] + (b[3] - a[3]) * t
	];
}

export function applySimpleToPreset(preset: StylePreset) {
	const simple = preset.simple;
	if (!simple) return;

	const accent = color(simple.accent);
	const background = color(simple.background);
	const text = color(simple.text);
	const border = color(simple.border);

	// Dark backgrounds get "raised" surfaces by mixing toward white, light ones toward black.
	const darkBg = 0.299 * background[0] + 0.587 * background[1] + 0.114 * background[2] < 0.5;
	const white: Color = [1, 1, 1, 1];
	const black: Color = [0, 0, 0, 1];
	const clear: Color = [0, 0, 0, 0];

	const raise = (c: Color, amount: number) => lerp(c, darkBg ? white : black, amount);
	const sink = (c: Color, amount: number) => lerp(c, darkBg ? black : white, amount);
	const mix = (c: Color, d: Color, t: number) => lerp(c, d, t);
	const withA = (c: Color, alpha: number): Color => [c[0], c[1], c[2], alpha];

	const set = (col: number, value: Color) => setColor(preset, col, value);

	set(ImGuiCol.Text, withA(text, 1));
	set(ImGuiCol.TextDisabled, mix(text, background, 0.55));
	set(ImGuiCol.WindowBg, withA(background, 1));
	set(ImGuiCol.ChildBg, clear);
	set(ImGuiCol.PopupBg, withA(sink(background, 0.15), 0.98));
	set(ImGuiCol.Border, withA(border, 0.5));
	set(ImGuiCol.BorderShadow, clear);
	set(ImGuiCol.FrameBg, mix(background, accent, 0.15));
	set(ImGuiCol.FrameBgHovered, mix(background, accent, 0.28));
	set(ImGuiCol.FrameBgActive, mix(background, accent, 0.4));
	set(ImGuiCol.TitleBg, sink(background, 0.25));
	set(ImGuiCol.TitleBgActive, mix(background, accent, 0.5));
	set(ImGuiCol.TitleBgCollapsed, withA(sink(background, 0.25), 0.85));
	set(ImGuiCol.MenuBarBg, sink(background, 0.1));
	set(ImGuiCol.ScrollbarBg, withA(sink(background, 0.2), 0.6));
	set(ImGuiCol.ScrollbarGrab, raise(background, 0.2));
	set(ImGuiCol.ScrollbarGrabHovered, raise(background, 0.32));
	set(ImGuiCol.ScrollbarGrabActive, accent);
	set(ImGuiCol.CheckMark, accent);
	set(ImGuiCol.CheckboxSelectedBg, withA(accent, 0.25));
	set(ImGuiCol.SliderGrab, accent);
	set(ImGuiCol.SliderGrabActive, raise(accent, 0.2));
	set(ImGuiCol.Button, withA(accent, 0.55));
	set(ImGuiCol.ButtonHovered, withA(accent, 0.8));
	set(ImGuiCol.ButtonActive, withA(accent, 1));
	set(ImGuiCol.Header, withA(accent, 0.45));
	set(ImGuiCol.HeaderHovered, withA(accent, 0.7));
	set(ImGuiCol.HeaderActive, withA(accent, 0.9));
	set(ImGuiCol.Separator, withA(border, 0.5));
	set(ImGuiCol.SeparatorHovered, withA(accent, 0.7));
	set(ImGuiCol.SeparatorActive, accent);
	set(ImGuiCol.ResizeGrip, withA(accent, 0.2));
	set(ImGuiCol.ResizeGripHovered, withA(accent, 0.55));
	set(ImGuiCol.ResizeGripActive, withA(accent, 0.9));
	set(ImGuiCol.InputTextCursor, withA(text, 1));
	set(ImGuiCol.TabHovered, withA(accent, 0.8));
	set(ImGuiCol.Tab, mix(background, accent, 0.3));
	set(ImGuiCol.TabSelected, mix(background, accent, 0.55));
	set(ImGuiCol.TabSelectedOverline, accent);
	set(ImGuiCol.TabDimmed, mix(background, accent, 0.12));
	set(ImGuiCol.TabDimmedSelected, mix(background, accent, 0.28));
	set(ImGuiCol.TabDimmedSelectedOverline, withA(accent, 0.5));
	set(ImGuiCol.DockingPreview, withA(accent, 0.7));
	set(ImGuiCol.DockingEmptyBg, sink(background, 0.3));
	set(ImGuiCol.PlotLines, withA(text, 0.8));
	set(ImGuiCol.PlotLinesHovered, accent);
	set(ImGuiCol.PlotHistogram, withA(accent, 0.9));
	set(ImGuiCol.PlotHistogramHovered, raise(accent, 0.2));
	set(ImGuiCol.TableHeaderBg, mix(background, accent, 0.2));
	set(ImGuiCol.TableBorderStrong, withA(border, 0.7));
	set(ImGuiCol.TableBorderLight, withA(border, 0.4));
	set(ImGuiCol.TableRowBg, clear);
	set(ImGuiCol.TableRowBgAlt, withA(raise(background, 0.04), 1));
	set(ImGuiCol.TextLink, accent);
	set(ImGuiCol.TextSelectedBg, withA(accent, 0.35));
	set(ImGuiCol.TreeLines, withA(border, 0.5));
	set(ImGuiCol.DragDropTarget, withA(accent, 0.9));
	set(ImGuiCol.DragDropTargetBg, withA(accent, 0.2));
	set(ImGuiCol.UnsavedMarker, withA(text, 0.8));
	set(ImGuiCol.NavCursor, accent);
	set(ImGuiCol.NavWindowingHighlight, withA(text, 0.7));
	set(ImGuiCol.NavWindowingDimBg, [0.2, 0.2, 0.2, 0.2]);
	set(ImGuiCol.ModalWindowDimBg, [0.05, 0.05, 0.05, 0.5]);

	for (const v of ROUNDING_VARS) preset.styleVarValues[v] = simple.rounding;
	for (const v of BORDER_VARS) preset.styleVarValues[v] = simple.borderSize;

	const setVec2 = (v: number, x: number, y: number) => {
		preset.styleVarValues[v] = x;
		preset.styleVarValuesY[v] = y;
	};

	const spacing = simple.spacing;
	setVec2(ImGuiStyleVar.FramePadding, spacing, Math.round(spacing * 0.5));
	setVec2(ImGuiStyleVar.ItemSpacing, spacing, Math.round(spacing * 0.6));
	setVec2(ImGuiStyleVar.WindowPadding, spacing, spacing);
	setVec2(ImGuiStyleVar.ItemInnerSpacing, Math.round(spacing * 0.6), Math.round(spacing * 0.6));
	setVec2(ImGuiStyleVar.CellPadding, spacing, Math.round(spacing * 0.5));
}

export function deriveSimpleFromPreset(preset: StylePreset): SimpleStyleParams {
	const rgb = (col: number): [number, number, number] => [
		preset.colors[col * 4],
		preset.colors[col * 4 + 1],
		preset.colors[col * 4 + 2]
	];

	return {
		accent: rgb(ImGuiCol.CheckMark),
		background: rgb(ImGuiCol.WindowBg),
		text: rgb(ImGuiCol.Text),
		border: rgb(ImGuiCol.Border),
		rounding: preset.styleVarValues[ImGuiStyleVar.FrameRounding],
		borderSize: preset.styleVarValues[ImGuiStyleVar.WindowBorderSize],
		spacing: preset.styleVarValues[ImGuiStyleVar.FramePadding]
	};
}

// ── editor ranges ────────────────────────────────────────────────────────────

export function floatRange(styleVar: number): [number, number] {
	switch (styleVar) {
		case ImGuiStyleVar.Alpha:
		case ImGuiStyleVar.DisabledAlpha:
			return [0.1, 1];
		case ImGuiStyleVar.WindowRounding:
		case ImGuiStyleVar.ChildRounding:
		case ImGuiStyleVar.PopupRounding:
		case ImGuiStyleVar.FrameRounding:
		case ImGuiStyleVar.ScrollbarRounding:
		case ImGuiStyleVar.GrabRounding:
		case ImGuiStyleVar.ImageRounding:
		case ImGuiStyleVar.TabRounding:
		case ImGuiStyleVar.TreeLinesRounding:
		case ImGuiStyleVar.DragDropTargetRounding:
			return [0, 12];
		case ImGuiStyleVar.WindowBorderSize:
		case ImGuiStyleVar.ChildBorderSize:
		case ImGuiStyleVar.PopupBorderSize:
		case ImGuiStyleVar.FrameBorderSize:
		case ImGuiStyleVar.TabBorderSize:
		case ImGuiStyleVar.TabBarBorderSize:
		case ImGuiStyleVar.TabBarOverlineSize:
		case ImGuiStyleVar.ImageBorderSize:
		case ImGuiStyleVar.SeparatorSize:
		case ImGuiStyleVar.SeparatorTextBorderSize:
		case ImGuiStyleVar.DockingSeparatorSize:
			return [0, 4];
		case ImGuiStyleVar.IndentSpacing:
			return [0, 40];
		case ImGuiStyleVar.ScrollbarSize:
		case ImGuiStyleVar.ScrollbarPadding:
		case ImGuiStyleVar.GrabMinSize:
		case ImGuiStyleVar.TreeLinesSize:
			return [1, 32];
		case ImGuiStyleVar.TabMinWidthBase:
		case ImGuiStyleVar.TabMinWidthShrink:
			return [0, 300];
		case ImGuiStyleVar.TableAngledHeadersAngle:
			return [0, 1.5708];
		default:
			return [0, 1];
	}
}

export function vec2Range(styleVar: number): [number, number] {
	switch (styleVar) {
		case ImGuiStyleVar.WindowPadding:
		case ImGuiStyleVar.FramePadding:
		case ImGuiStyleVar.ItemSpacing:
		case ImGuiStyleVar.ItemInnerSpacing:
		case ImGuiStyleVar.CellPadding:
			return [0, 32];
		case ImGuiStyleVar.WindowMinSize:
			return [0, 200];
		case ImGuiStyleVar.SeparatorTextPadding:
			return [0, 40];
		default:
			return [0, 1];
	}
}

// ── persistence ──────────────────────────────────────────────────────────────

export function customPresetNames(): string[] {
	return DataStorage.keys(STORAGE_ID).filter((name) => name !== SELECTED_KEY);
}

export function loadPreset(name: string): StylePreset | null {
	const stored = DataStorage.load<StylePreset | null>(STORAGE_ID, name, null);
	if (!stored?.colors) return null;

	// Presets saved by an older ImGui build can be short a few colours or vars.
	return {
		colors: pad(stored.colors, COLOR_COUNT * 4),
		styleVarValues: pad(stored.styleVarValues ?? [], STYLE_VAR_COUNT),
		styleVarValuesY: pad(stored.styleVarValuesY ?? [], STYLE_VAR_COUNT),
		simple: stored.simple
	};
}

export function savePreset(name: string, preset: StylePreset) {
	DataStorage.save(STORAGE_ID, name, preset);
}

export function deletePreset(name: string) {
	DataStorage.delete(STORAGE_ID, name);
}

export function loadSelectedName(): string | null {
	return DataStorage.load<string | null>(STORAGE_ID, SELECTED_KEY, null);
}

export function saveSelectedName(name: string) {
	DataStorage.save(STORAGE_ID, SELECTED_KEY, name);
}

function pad(values: number[], length: number) {
	const result = values.slice(0, length);
	while (result.length < length) result.push(0);
	return result;
}

export function clonePreset(preset: StylePreset): StylePreset {
	return {
		colors: [...preset.colors],
		styleVarValues: [...preset.styleVarValues],
		styleVarValuesY: [...preset.styleVarValuesY],
		simple: preset.simple ? { ...preset.simple } : undefined
	};
}
