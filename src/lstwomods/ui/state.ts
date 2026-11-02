
import { Ref } from '../core/ref';
import { DataStorage } from '../core/storage';

const SETTINGS_ID = 'settings';

function persisted<T>(key: string, fallback: T) {
	const ref = new Ref<T>(DataStorage.load<T>(SETTINGS_ID, key, fallback));
	ref.subscribe((value) => DataStorage.save(SETTINGS_ID, key, value));
	return ref;
}

export const overlaySettings = {
	fontScale: persisted('fontScale', 1),
	dimPage: persisted('dimPage', false),
	dimAmount: persisted('dimAmount', 0.35),
	showDemoWindow: persisted('showDemoWindow', false)
};

export const overlayEnabled = new Ref(true);

export const WINDOW_SETTINGS = 'Settings';
export const WINDOW_STYLE_EDITOR = 'Style Editor';
