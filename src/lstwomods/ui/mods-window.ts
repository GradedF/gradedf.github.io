
import { ImGui, ImGuiCond, ImGuiTreeNodeFlags } from '@mori2003/jsimgui';
import type { Mod } from '../core/mod';
import { DataStorage } from '../core/storage';
import { drawModPanel } from './autoui';
import { inputText, tooltip } from './widgets';

const ORDER_STORAGE_ID = 'lstwoMODS_Core';
const REORDER_PAYLOAD_TYPE = 'LSTWO_MOD_REORDER';

let draggedMod: Mod | null = null;

export class ModsWindow {
	readonly name: string;
	mods: Mod[] = [];

	#search = '';
	#registrationOrder: Mod[] | null = null;

	constructor(name: string) {
		this.name = name;
	}

	get #orderStorageKey() {
		return `mod_order-${this.name}`;
	}

	add(mod: Mod) {
		this.mods.push(mod);
	}

	applySavedOrder() {
		this.#registrationOrder ??= [...this.mods];

		const saved = DataStorage.load<string[]>(ORDER_STORAGE_ID, this.#orderStorageKey, []);
		if (saved.length === 0) return;

		const index = new Map(saved.map((id, i) => [id, i]));
		this.mods.sort(
			(a, b) => (index.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (index.get(b.id) ?? Number.MAX_SAFE_INTEGER)
		);
	}

	resetOrder() {
		DataStorage.delete(ORDER_STORAGE_ID, this.#orderStorageKey);
		if (!this.#registrationOrder) return;

		const ordered = this.#registrationOrder.filter((mod) => this.mods.includes(mod));
		this.mods = [...ordered, ...this.mods.filter((mod) => !ordered.includes(mod))];
	}

	#saveOrder() {
		DataStorage.save(
			ORDER_STORAGE_ID,
			this.#orderStorageKey,
			this.mods.map((mod) => mod.id)
		);
	}

	#moveMod(dragged: Mod, target: Mod, below: boolean) {
		if (dragged === target) return;

		this.mods = this.mods.filter((mod) => mod !== dragged);
		let index = this.mods.indexOf(target);
		if (index < 0) index = this.mods.length;
		else if (below) index++;

		this.mods.splice(index, 0, dragged);
		this.#saveOrder();
	}

	#matchesSearch(mod: Mod) {
		const query = this.#search.trim().toLowerCase();
		if (query === '') return true;
		return (
			mod.name.toLowerCase().includes(query) || (mod.description ?? '').toLowerCase().includes(query)
		);
	}

	draw() {
		const typed = inputText(`##search_${this.name}`, this.#search, 'Search mods...');
		if (typed != null) this.#search = typed;

		ImGui.Separator();

		for (const mod of [...this.mods]) {
			if (!this.#matchesSearch(mod)) continue;

			const open = ImGui.CollapsingHeader(`${mod.name}###${mod.id}`, ImGuiTreeNodeFlags.None);
			tooltip(mod.description);

			if (ImGui.BeginDragDropSource()) {
				draggedMod = mod;
				ImGui.SetDragDropPayload(REORDER_PAYLOAD_TYPE, mod.id, mod.id.length, ImGuiCond.Once);
				ImGui.Text(mod.name);
				ImGui.EndDragDropSource();
			}

			if (ImGui.BeginDragDropTarget()) {
				const payload = ImGui.AcceptDragDropPayload(REORDER_PAYLOAD_TYPE);
				if (payload?.ptr != null && draggedMod) {
					const min = ImGui.GetItemRectMin();
					const max = ImGui.GetItemRectMax();
					const mouseY = ImGui.GetMousePos().y;
					this.#moveMod(draggedMod, mod, mouseY > (min.y + max.y) / 2);
					draggedMod = null;
				}
				ImGui.EndDragDropTarget();
			}

			if (!open) continue;

			ImGui.Indent();
			try {
				drawModPanel(mod);
			} catch (error) {
				console.error(`[lstwoMODS demo] error rendering mod UI (${mod.name})`, error);
				ImGui.TextDisabled('This mod failed to draw.');
			}
			ImGui.Unindent();
			ImGui.Spacing();
		}

		if (this.mods.every((mod) => !this.#matchesSearch(mod))) {
			ImGui.TextDisabled('No mods match your search.');
		}
	}
}

const windows = new Map<string, ModsWindow>();

export function modsWindow(name: string) {
	let window = windows.get(name);
	if (!window) windows.set(name, (window = new ModsWindow(name)));
	return window;
}

export function allModsWindows() {
	return [...windows.values()];
}

export function resetAllModOrders() {
	for (const window of windows.values()) window.resetOrder();
}

export function clearModsWindows() {
	windows.clear();
}
