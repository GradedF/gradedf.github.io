
import { ImGui, ImVec2 } from '@mori2003/jsimgui';

export function tooltip(text: string | undefined) {
	if (text) ImGui.SetItemTooltip(text);
}

export function fullWidthButton(label: string) {
	return ImGui.Button(label, new ImVec2(ImGui.CalcItemWidth(), 0));
}

export function drawSeparators(options: { separator?: boolean; separatorText?: string }) {
	if (options.separatorText) ImGui.SeparatorText(options.separatorText);
	else if (options.separator) ImGui.Separator();
}

export function combo(label: string, current: number, items: string[]): number | null {
	if (items.length === 0) return null;

	const index = Math.min(Math.max(current, 0), items.length - 1);
	if (!ImGui.BeginCombo(label, items[index])) return null;

	let picked: number | null = null;

	for (const [i, item] of items.entries()) {
		const selected = i === index;
		if (ImGui.Selectable(`${item}###combo-item-${i}`, selected)) picked = i;
		if (selected) ImGui.SetItemDefaultFocus();
	}

	ImGui.EndCombo();
	return picked !== index ? picked : null;
}

export function inputText(label: string, value: string, hint?: string, maxLength = 256): string | null {
	const scratch: [string] = [value];
	const changed = hint
		? ImGui.InputTextWithHint(label, hint, scratch, maxLength)
		: ImGui.InputText(label, scratch, maxLength);
	return changed ? scratch[0] : null;
}

export function checkbox(label: string, value: boolean): boolean | null {
	const scratch: [boolean] = [value];
	return ImGui.Checkbox(label, scratch) ? scratch[0] : null;
}

export function dragFloat(
	label: string,
	value: number,
	speed: number,
	min: number,
	max: number,
	format = '%.2f'
): number | null {
	const scratch: [number] = [value];
	return ImGui.DragFloat(label, scratch, speed, min, max, format) ? scratch[0] : null;
}

export function sliderFloat(
	label: string,
	value: number,
	min: number,
	max: number,
	format = '%.2f'
): number | null {
	const scratch: [number] = [value];
	return ImGui.SliderFloat(label, scratch, min, max, format) ? scratch[0] : null;
}

export function dragInt(
	label: string,
	value: number,
	speed: number,
	min: number,
	max: number
): number | null {
	const scratch: [number] = [value];
	return ImGui.DragInt(label, scratch, speed, min, max) ? scratch[0] : null;
}

export function sliderInt(label: string, value: number, min: number, max: number): number | null {
	const scratch: [number] = [value];
	return ImGui.SliderInt(label, scratch, min, max) ? scratch[0] : null;
}

export function colorEdit3(label: string, value: readonly number[], flags = 0) {
	const scratch: [number, number, number] = [value[0], value[1], value[2]];
	return ImGui.ColorEdit3(label, scratch, flags) ? ([...scratch] as [number, number, number]) : null;
}

export function colorEdit4(label: string, value: readonly number[], flags = 0) {
	const scratch: [number, number, number, number] = [value[0], value[1], value[2], value[3] ?? 1];
	return ImGui.ColorEdit4(label, scratch, flags)
		? ([...scratch] as [number, number, number, number])
		: null;
}

export function dragFloat2(
	label: string,
	x: number,
	y: number,
	speed: number,
	min: number,
	max: number
): [number, number] | null {
	const width = ImGui.CalcItemWidth();
	const spacing = ImGui.GetStyle().ItemInnerSpacing.x;
	const each = Math.max(30, (width - spacing) / 2);

	ImGui.PushID(label);
	ImGui.SetNextItemWidth(each);
	const first = dragFloat('##x', x, speed, min, max, '%.1f');
	ImGui.SameLine(0, spacing);
	ImGui.SetNextItemWidth(each);
	const second = dragFloat('##y', y, speed, min, max, '%.1f');
	ImGui.SameLine(0, spacing);
	ImGui.Text(label.split('###')[0].split('##')[0]);
	ImGui.PopID();

	return first != null || second != null ? [first ?? x, second ?? y] : null;
}
