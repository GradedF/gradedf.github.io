
import { ImGui, ImGuiColorEditFlags } from '@mori2003/jsimgui';
import type { Mod, ModAction, ModSetting, Rgb, Rgba } from '../core/mod';
import { actionLabel, settingLabel } from '../core/mod';
import {
	checkbox,
	colorEdit3,
	colorEdit4,
	combo,
	dragFloat,
	dragInt,
	drawSeparators,
	fullWidthButton,
	inputText,
	sliderFloat,
	sliderInt,
	tooltip
} from './widgets';

const pendingText = new Map<string, string>();

function byOrder<T extends { order?: number }>(items: T[]) {
	return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function id(mod: Mod, key: string) {
	return `${mod.id}.${key}`;
}

function drawSetting(mod: Mod, setting: ModSetting) {
	if (setting.showInUI === false) return;

	drawSeparators(setting);

	const label = `${settingLabel(setting)}###${id(mod, setting.key)}`;
	const useSlider =
		(setting.type === 'float' || setting.type === 'int') &&
		(setting.widget === 'slider' ||
			(setting.widget !== 'drag' && setting.min != null && setting.max != null));

	switch (setting.type) {
		case 'bool': {
			const next = checkbox(label, setting.ref.value);
			if (next != null) setting.ref.value = next;
			break;
		}

		case 'float': {
			const min = setting.min ?? 0;
			const max = setting.max ?? 0;
			const format = setting.format ?? '%.2f';
			const next = useSlider
				? sliderFloat(label, setting.ref.value, min, max, format)
				: dragFloat(label, setting.ref.value, setting.speed ?? 0.05, min, max, format);
			if (next != null) setting.ref.value = next;
			break;
		}

		case 'int': {
			const min = setting.min ?? 0;
			const max = setting.max ?? 0;
			const next = useSlider
				? sliderInt(label, setting.ref.value, min, max)
				: dragInt(label, setting.ref.value, setting.speed ?? 1, min, max);
			if (next != null) setting.ref.value = next;
			break;
		}

		case 'string': {
			if (setting.applyButton) {
				const key = id(mod, setting.key);
				const buffered = pendingText.get(key) ?? setting.ref.value;

				ImGui.SetNextItemWidth(ImGui.CalcItemWidth());
				const typed = inputText(`##${key}`, buffered, setting.hint);
				if (typed != null) pendingText.set(key, typed);

				ImGui.SameLine();
				if (ImGui.Button(`${setting.applyButtonLabel ?? `Set ${settingLabel(setting)}`}###apply_${key}`)) {
					setting.ref.value = pendingText.get(key) ?? setting.ref.value;
				}
			} else {
				const next = inputText(label, setting.ref.value, setting.hint);
				if (next != null) setting.ref.value = next;
			}
			break;
		}

		case 'color3': {
			const next = colorEdit3(label, setting.ref.value);
			if (next != null) setting.ref.value = next as Rgb;
			break;
		}

		case 'color4': {
			const next = colorEdit4(label, setting.ref.value, ImGuiColorEditFlags.AlphaBar);
			if (next != null) setting.ref.value = next as Rgba;
			break;
		}

		case 'enum': {
			const next = combo(label, setting.ref.value, setting.options);
			if (next != null) setting.ref.value = next;
			break;
		}
	}

	tooltip(setting.description);
}

function drawAction(mod: Mod, action: ModAction) {
	if (action.showInUI === false) return;

	drawSeparators(action);

	const label = `${actionLabel(action)}###${id(mod, action.key)}`;
	const clicked = action.contentWidth === false ? ImGui.Button(label) : fullWidthButton(label);

	tooltip(action.description);

	if (clicked) {
		try {
			action.invoke();
		} catch (error) {
			console.error(`[lstwoMODS demo] action ${mod.name}/${action.key} threw`, error);
		}
	}
}

export function drawModPanel(mod: Mod) {
	ImGui.PushID(mod.id);

	for (const setting of byOrder(mod.settings)) drawSetting(mod, setting);
	for (const action of byOrder(mod.actions)) drawAction(mod, action);

	ImGui.PopID();
}
