
import { page } from '../core/dom';
import type { Mod } from '../core/mod';
import { designModeMod } from './design-mode';
import { elementToolsMod } from './element-tools';
import { gradedfMod } from './gradedf';
import { inspectorMod } from './inspector';
import { typographyMod } from './typography';

export function createMods(): Mod[] {
	page.root();

	return [
		gradedfMod,
		designModeMod,
		typographyMod,
		inspectorMod,
		elementToolsMod
	];
}
