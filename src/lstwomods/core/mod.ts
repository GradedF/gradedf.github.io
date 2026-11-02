
import type { Ref } from './ref';

export type WidgetType = 'default' | 'drag' | 'slider' | 'input';

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];

interface CommonSettingOptions {
	key: string;
	label?: string;
	description?: string;
	order?: number;
	separator?: boolean;
	separatorText?: string;
	showInUI?: boolean;
}

interface NumberSettingOptions {
	min?: number;
	max?: number;
	speed?: number;
	format?: string;
	widget?: WidgetType;
}

export type ModSetting =
	| ({ type: 'bool'; ref: Ref<boolean>; onChange?: (value: boolean) => void } & CommonSettingOptions)
	| ({
			type: 'float';
			ref: Ref<number>;
			onChange?: (value: number) => void;
	  } & CommonSettingOptions &
			NumberSettingOptions)
	| ({
			type: 'int';
			ref: Ref<number>;
			onChange?: (value: number) => void;
	  } & CommonSettingOptions &
			NumberSettingOptions)
	| ({
			type: 'string';
			ref: Ref<string>;
			hint?: string;
			applyButton?: boolean;
			applyButtonLabel?: string;
			onChange?: (value: string) => void;
	  } & CommonSettingOptions)
	| ({ type: 'color3'; ref: Ref<Rgb>; onChange?: (value: Rgb) => void } & CommonSettingOptions)
	| ({ type: 'color4'; ref: Ref<Rgba>; onChange?: (value: Rgba) => void } & CommonSettingOptions)
	| ({
			type: 'enum';
			ref: Ref<number>;
			options: string[];
			onChange?: (value: number) => void;
	  } & CommonSettingOptions);

export interface ModAction {
	key: string;
	label?: string;
	description?: string;
	order?: number;
	separator?: boolean;
	separatorText?: string;
	showInUI?: boolean;
	contentWidth?: boolean;
	invoke: () => void;
}

export interface ModDefinition {
	id: string;
	name: string;
	description: string;
	window: string;
	settings?: ModSetting[];
	actions?: ModAction[];
	awake?: () => void;
	dispose?: () => void;
}

export interface Mod extends ModDefinition {
	settings: ModSetting[];
	actions: ModAction[];
	apply: () => void;
	reset: () => void;
}

export function defineMod(definition: ModDefinition): Mod {
	const settings = definition.settings ?? [];
	const actions = definition.actions ?? [];
	const defaults = new Map<string, unknown>(settings.map((setting) => [setting.key, setting.ref.value]));

	for (const setting of settings) {
		if (!setting.onChange) continue;
		const handler = setting.onChange as (value: unknown) => void;
		setting.ref.subscribe((value) => {
			try {
				handler(value);
			} catch (error) {
				console.error(`[lstwoMODS demo] ${definition.name}/${setting.key} handler threw`, error);
			}
		});
	}

	return {
		...definition,
		settings,
		actions,
		apply() {
			for (const setting of settings) setting.ref.emit();
		},
		reset() {
			for (const setting of settings) {
				const value = defaults.get(setting.key);
				if (value !== undefined) (setting.ref as Ref<unknown>).value = value;
			}
		}
	};
}

export function settingLabel(setting: ModSetting) {
	return setting.label ?? setting.key;
}

export function actionLabel(action: ModAction) {
	return action.label ?? action.key;
}
