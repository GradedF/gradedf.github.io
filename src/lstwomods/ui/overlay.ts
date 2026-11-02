
import {
	ImGui,
	ImGuiCond,
	ImGuiConfigFlags,
	ImGuiDockNodeFlags,
	ImGuiImplWeb,
	ImGuiWindowFlags,
	ImVec2,
	type ImVec4
} from '@mori2003/jsimgui';
import { page } from '../core/dom';
import { createMods } from '../mods';
import { allModsWindows, clearModsWindows, modsWindow } from './mods-window';
import { drawSettingsWindow, setLayoutResetHandler } from './settings-window';
import {
	WINDOW_SETTINGS,
	WINDOW_STYLE_EDITOR,
	overlayEnabled,
	overlaySettings
} from './state';
import { drawStyleEditorWindow, disposeStyleEditor, initStyleEditor } from './style-editor-window';
import { presetColorVectors, pushPresetColors } from './style';
import { DataStorage } from '../core/storage';

const INI_STORAGE_ID = 'ui';
const INI_KEY = 'imgui-ini';

const FONT_URL = '/fonts/Inter-Overlay.ttf';
const FONT_NAME = 'Inter-Overlay.ttf';
const FONT_SIZE = 16;
const WINDOW_STATE_ID = 'WindowState';
const DOCKSPACE_ID = 'LstwoModsDockSpace';

const DEFAULT_WINDOW_SIZE = new ImVec2(560, 420);

interface OverlayWindow {
	name: string;
	title: string;
	open: boolean;
	draw: () => void;
}

export interface Overlay {
	dispose: () => void;
	toggle: () => void;
	readonly enabled: boolean;
}

function buildWindows(): OverlayWindow[] {
	const windows: OverlayWindow[] = allModsWindows().map((modsWindowInstance) => ({
		name: modsWindowInstance.name,
		title: modsWindowInstance.name,
		open: true,
		draw: () => modsWindowInstance.draw()
	}));

	windows.push(
		{ name: WINDOW_STYLE_EDITOR, title: WINDOW_STYLE_EDITOR, open: false, draw: drawStyleEditorWindow },
		{ name: WINDOW_SETTINGS, title: WINDOW_SETTINGS, open: false, draw: drawSettingsWindow }
	);

	for (const window of windows) {
		window.open = DataStorage.load(WINDOW_STATE_ID, window.name, window.open);
	}

	return windows;
}

async function loadFont() {
	const fonts = ImGui.GetIO().Fonts;

	try {
		const response = await fetch(FONT_URL);
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

		ImGuiImplWeb.LoadFont(FONT_NAME, new Uint8Array(await response.arrayBuffer()));
		fonts.AddFontFromFileTTF(FONT_NAME, FONT_SIZE);
	} catch (error) {
		console.warn('[lstwoMODS demo] could not load Inter, using the built-in font', error);
		fonts.AddFontDefaultVector();
	}
}

export async function startOverlay(canvas: HTMLCanvasElement): Promise<Overlay> {
	ImGuiImplWeb.SetSaveIniSettingsFn((ini) => DataStorage.save(INI_STORAGE_ID, INI_KEY, ini));
	ImGuiImplWeb.SetLoadIniSettingsFn(() => DataStorage.load(INI_STORAGE_ID, INI_KEY, ''));

	await ImGuiImplWeb.Init({ canvas });

	const io = ImGui.GetIO();
	io.ConfigFlags |= ImGuiConfigFlags.NavEnableKeyboard | ImGuiConfigFlags.DockingEnable;
	await loadFont();

	clearModsWindows();

	const mods = createMods();
	for (const mod of mods) {
		modsWindow(mod.window).add(mod);
		mod.awake?.();
	}
	for (const window of allModsWindows()) window.applySavedOrder();

	let presetColors: ImVec4[] = [];
	const editor = initStyleEditor((updated) => {
		presetColors = presetColorVectors(updated);
	});
	presetColors = presetColorVectors(editor.preset);

	const windows = buildWindows();

	setLayoutResetHandler(() => {
		DataStorage.delete(INI_STORAGE_ID, INI_KEY);
		ImGui.LoadIniSettingsFromMemory(generateDefaultIni(windows));
	});

	// ── input plumbing ───────────────────────────────────────────────────────

	let clickThrough = true;

	const forwardPointerMove = (event: PointerEvent) => {
		if (!clickThrough) return;
		canvas.dispatchEvent(
			new PointerEvent('pointermove', {
				bubbles: false,
				clientX: event.clientX,
				clientY: event.clientY,
				pointerType: event.pointerType
			})
		);
	};

	const onWheel = (event: WheelEvent) => {
		if (!clickThrough) event.preventDefault();
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.code !== 'F2') return;
		event.preventDefault();
		toggle();
	};

	window.addEventListener('pointermove', forwardPointerMove, { passive: true });
	window.addEventListener('keydown', onKeyDown);
	canvas.addEventListener('wheel', onWheel, { passive: false });

	function toggle() {
		overlayEnabled.value = !overlayEnabled.value;
	}

	// ── frame loop ───────────────────────────────────────────────────────────

	let frameHandle = 0;
	let disposed = false;
	let running = false;

	function blankCanvas() {
		const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
		if (!gl) return;

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	function syncDim() {
		const amount =
			overlaySettings.dimPage.value && overlayEnabled.value ? overlaySettings.dimAmount.value : 0;

		page.rule(
			'overlay-dim',
			amount > 0
				? `body::after { content: ""; position: fixed; inset: 0; background: rgb(0 0 0 / ${amount}); pointer-events: none; z-index: 2147483000; }`
				: null
		);
	}

	function standDown() {
		blankCanvas();
		syncDim();

		clickThrough = true;
		canvas.style.pointerEvents = 'none';

		canvas.tabIndex = -1;
		if (document.activeElement === canvas) canvas.blur();
	}

	function frame() {
		if (disposed) return;

		if (!overlayEnabled.value) {
			running = false;
			standDown();
			return;
		}

		frameHandle = requestAnimationFrame(frame);
		syncDim();

		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
		}

		ImGuiImplWeb.BeginRender();

		const style = ImGui.GetStyle();
		style.FontScaleMain = overlaySettings.fontScale.value;

		const pushedColors = pushPresetColors(presetColors);

		ImGui.DockSpaceOverViewport(
			ImGui.GetID(DOCKSPACE_ID),
			null,
			ImGuiDockNodeFlags.PassthruCentralNode
		);

		drawMenuBar(windows);
		drawWindows(windows);

		if (overlaySettings.showDemoWindow.value) ImGui.ShowDemoWindow();

		if (pushedColors > 0) ImGui.PopStyleColor(pushedColors);

		ImGuiImplWeb.EndRender();

		const wantsMouse = ImGui.GetIO().WantCaptureMouse;
		if (wantsMouse === clickThrough) {
			clickThrough = !wantsMouse;
			canvas.style.pointerEvents = clickThrough ? 'none' : 'auto';
		}
	}

	function startLoop() {
		if (running || disposed) return;

		running = true;
		canvas.tabIndex = 0;
		frameHandle = requestAnimationFrame(frame);
	}

	const unsubscribeEnabled = overlayEnabled.subscribe((on) => {
		if (on) startLoop();
	});

	if (overlayEnabled.value) startLoop();
	else standDown();

	return {
		toggle,
		get enabled() {
			return overlayEnabled.value;
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			running = false;

			cancelAnimationFrame(frameHandle);
			unsubscribeEnabled();
			window.removeEventListener('pointermove', forwardPointerMove);
			window.removeEventListener('keydown', onKeyDown);
			canvas.removeEventListener('wheel', onWheel);

			disposeStyleEditor();

			for (const mod of mods) {
				try {
					mod.dispose?.();
				} catch (error) {
					console.error(`[lstwoMODS demo] ${mod.name} failed to clean up`, error);
				}
			}

			page.dispose();
		}
	};
}

function drawMenuBar(windows: OverlayWindow[]) {
	if (!ImGui.BeginMainMenuBar()) return;

	ImGui.TextDisabled('lstwoMODS');
	ImGui.Separator();

	for (const window of windows) {
		if (ImGui.MenuItem(window.name, undefined, window.open)) {
			window.open = !window.open;
			DataStorage.save(WINDOW_STATE_ID, window.name, window.open);
		}
	}

	ImGui.EndMainMenuBar();
}

function drawWindows(windows: OverlayWindow[]) {
	for (const window of windows) {
		if (!window.open) continue;

		const openState: [boolean] = [true];
		ImGui.SetNextWindowSize(DEFAULT_WINDOW_SIZE, ImGuiCond.FirstUseEver);

		if (ImGui.Begin(`${window.title}###${window.name}`, openState, ImGuiWindowFlags.None)) {
			try {
				window.draw();
			} catch (error) {
				console.error(`[lstwoMODS demo] error drawing window "${window.name}"`, error);
				ImGui.TextDisabled('This window failed to draw — see the browser console.');
			}
		}
		ImGui.End();

		if (!openState[0]) {
			window.open = false;
			DataStorage.save(WINDOW_STATE_ID, window.name, false);
		}
	}
}

function generateDefaultIni(windows: OverlayWindow[]) {
	const lines: string[] = [];

	for (const [index, window] of windows.entries()) {
		lines.push(`[Window][###${window.name}]`, `DockId=0x00000001,${index}`, '');
	}

	lines.push('[Docking][Data]', 'DockNode          ID=0x00000001 Pos=0,0 Size=853,480');
	return lines.join('\n');
}
