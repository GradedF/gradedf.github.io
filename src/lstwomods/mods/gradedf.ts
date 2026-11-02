
import { page } from '../core/dom';
import { defineMod } from '../core/mod';
import { Ref } from '../core/ref';
import { DataStorage } from '../core/storage';

const STORAGE_ID = 'gradedf';

function persisted<T>(key: string, fallback: T) {
	const ref = new Ref<T>(DataStorage.load<T>(STORAGE_ID, key, fallback));
	ref.subscribe((value) => DataStorage.save(STORAGE_ID, key, value));
	return ref;
}

const hideAds = persisted('hideAds', false);
const hideWatermark = persisted('hideWatermark', false);
const blockVideoAds = persisted('blockVideoAds', false);
const blockCaptcha = persisted('blockCaptcha', false);
const blockCookieBanner = persisted('blockCookieBanner', false);

interface DialogGuardOptions {
	suppressClose?: boolean;
	setup?: (dialog: HTMLDialogElement) => void;
}

function guardDialog(selector: string, blocked: Ref<boolean>, options: DialogGuardOptions = {}) {
	const dialog = document.querySelector<HTMLDialogElement>(selector);
	if (!dialog) return;

	dialog.showModal = function () {
		if (!blocked.value) HTMLDialogElement.prototype.showModal.call(this);
	};

	if (options.suppressClose) {
		dialog.addEventListener(
			'close',
			(event) => {
				if (blocked.value) event.stopImmediatePropagation();
			},
			{ capture: true }
		);
	}

	options.setup?.(dialog);

	const closeIfBlocked = (value: boolean) => {
		if (value && dialog.open) dialog.close();
	};
	blocked.subscribe(closeIfBlocked);
	closeIfBlocked(blocked.value);
}

let installed = false;

export function applyGradedfMods() {
	if (installed) return;
	installed = true;

	guardDialog('.video-ad', blockVideoAds, {
		suppressClose: true,
		setup(dialog) {
			const video = dialog.querySelector('video');
			if (!video) return;

			const stopIfBlocked = () => {
				if (blockVideoAds.value) video.pause();
			};
			video.addEventListener('play', stopIfBlocked);
			blockVideoAds.subscribe(stopIfBlocked);
		}
	});
	guardDialog('.captcha-dialog', blockCaptcha);
	guardDialog('.cookie-consent', blockCookieBanner);

	gradedfMod.apply();
}

export const gradedfMod = defineMod({
	id: 'gradedf.cleanup',
	name: 'Ads & Popups',
	description: 'Hides the ads, the popups and the bouncing watermark. Saved across reloads.',
	window: 'Graded F',

	settings: [
		{
			type: 'bool',
			key: 'hideAds',
			label: 'Hide Ads',
			description: 'Sidebar and banner ads. The page layout stays where it is.',
			order: 0,
			ref: hideAds,
			onChange(value) {
				page.rule(
					'gradedf-hide-ads',
					value
						? `.left-sidebar, .right-sidebar { visibility: hidden; }
						   #ad-slot-banner { display: none !important; }
						   @media (max-width: 900px) { .left-sidebar, .right-sidebar { display: none !important; } }`
						: null
				);
			}
		},
		{
			type: 'bool',
			key: 'blockVideoAds',
			label: 'Block Video Ads',
			description: 'Stops the fullscreen video ad popup.',
			order: 10,
			ref: blockVideoAds
		},
		{
			type: 'bool',
			key: 'blockCaptcha',
			label: 'Block Captcha',
			description: 'Skips the "verify you are human" popup.',
			order: 20,
			ref: blockCaptcha
		},
		{
			type: 'bool',
			key: 'blockCookieBanner',
			label: 'Block Cookie Banner',
			order: 30,
			ref: blockCookieBanner
		},
		{
			type: 'bool',
			key: 'hideWatermark',
			label: 'Hide Watermark',
			order: 40,
			ref: hideWatermark,
			onChange(value) {
				page.rule('gradedf-hide-watermark', value ? '.watermark { display: none !important; }' : null);
			}
		}
	],

	actions: [
		{
			key: 'reset',
			label: 'Reset',
			separatorText: 'Actions',
			order: 100,
			invoke: () => gradedfMod.reset()
		}
	]
});
