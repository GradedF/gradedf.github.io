
import type { Overlay } from './ui/overlay';

const CANVAS_STYLE = `
	position: fixed;
	inset: 0;
	width: 100vw;
	height: 100vh;
	z-index: 2147483001;
	pointer-events: none;
	touch-action: none;
	user-select: none;
	outline: none;
`;

let pending: Promise<Overlay | null> | null = null;
let overlay: Overlay | null = null;
let canvas: HTMLCanvasElement | null = null;

export function currentOverlay() {
	return overlay;
}

export function ensureOverlay(): Promise<Overlay | null> {
	if (pending) return pending;

	pending = (async () => {
		for (const stray of document.querySelectorAll('canvas[data-lstwomods-overlay]')) stray.remove();

		canvas = document.createElement('canvas');
		canvas.dataset.lstwomodsOverlay = '';
		canvas.style.cssText = CANVAS_STYLE;
		document.body.appendChild(canvas);

		try {
			const module = import.meta.env.SSR ? null : await import('./ui/overlay');
			if (!module) throw new Error('the overlay runtime is browser-only');

			overlay = await module.startOverlay(canvas);
			return overlay;
		} catch (error) {
			console.error('[lstwoMODS demo] failed to start the overlay', error);
			canvas.remove();
			canvas = null;

			pending = null;
			return null;
		}
	})();

	return pending;
}

export function installOverlayHotkey() {
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.code !== 'F2' || overlay) return;
		event.preventDefault();
		void ensureOverlay();
	};

	window.addEventListener('keydown', onKeyDown);
	return () => window.removeEventListener('keydown', onKeyDown);
}

export function disposeOverlay() {
	overlay?.dispose();
	overlay = null;
	pending = null;
	canvas?.remove();
	canvas = null;
}

if (import.meta.hot) import.meta.hot.dispose(() => disposeOverlay());
