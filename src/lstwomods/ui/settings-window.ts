
import { ImGui, ImGuiWindowFlags, ImVec2 } from '@mori2003/jsimgui';
import { resetAllModOrders } from './mods-window';
import { overlaySettings } from './state';
import { checkbox, dragFloat, fullWidthButton, sliderFloat, tooltip } from './widgets';

const RESET_LAYOUT_POPUP = 'Reset UI State?';
const RESET_ORDER_POPUP = 'Reset Mod Order?';

let resetLayout: (() => void) | null = null;

export function setLayoutResetHandler(handler: () => void) {
	resetLayout = handler;
}

function confirmDialog(title: string, message: string, onConfirm: () => void) {
	if (!ImGui.BeginPopupModal(title, null, ImGuiWindowFlags.AlwaysAutoResize)) return;

	ImGui.TextWrapped(message);
	ImGui.Separator();

	if (ImGui.Button(`Confirm###${title}-ok`, new ImVec2(120, 0))) {
		onConfirm();
		ImGui.CloseCurrentPopup();
	}

	ImGui.SameLine();

	if (ImGui.Button(`Cancel###${title}-cancel`, new ImVec2(120, 0))) ImGui.CloseCurrentPopup();

	ImGui.EndPopup();
}

export function drawSettingsWindow() {
	const { fontScale, dimPage, dimAmount, showDemoWindow } = overlaySettings;

	ImGui.SeparatorText('Overlay');

	const scale = dragFloat('Font Scale###FontScale', fontScale.value, 0.01, 0.5, 3, '%.2f');
	if (scale != null) fontScale.value = scale;
	tooltip('Scales the whole overlay, exactly like the Font Scale entry in the plugin.');

	ImGui.SeparatorText('Page');

	const dim = checkbox('Dim The Page Behind The Overlay###DimPage', dimPage.value);
	if (dim != null) dimPage.value = dim;
	tooltip('The demo equivalent of the overlay window background colour.');

	if (dimPage.value) {
		const amount = sliderFloat('Dim Amount###DimAmount', dimAmount.value, 0, 0.9, '%.2f');
		if (amount != null) dimAmount.value = amount;
	}

	ImGui.SeparatorText('Debug');

	const demo = checkbox('Show Dear ImGui Demo Window###ShowDemo', showDemoWindow.value);
	if (demo != null) showDemoWindow.value = demo;
	tooltip('The stock ImGui demo window, handy for seeing the style editor at work.');

	ImGui.SeparatorText('');

	if (fullWidthButton('Reset Saved UI State (Window Layout, etc.)')) ImGui.OpenPopup(RESET_LAYOUT_POPUP);
	if (fullWidthButton('Reset Mod Order')) ImGui.OpenPopup(RESET_ORDER_POPUP);

	confirmDialog(RESET_LAYOUT_POPUP, 'Reset UI State to default?', () => resetLayout?.());
	confirmDialog(RESET_ORDER_POPUP, 'Reset the mod list order to default?', resetAllModOrders);
}
