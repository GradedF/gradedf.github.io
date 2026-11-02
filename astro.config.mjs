// @ts-check
import { defineConfig } from 'astro/config';

/**
 * `@mori2003/jsimgui` (used by the lstwoMODS overlay) picks its emscripten loader with a literal
 * dynamic import per feature combination. Rollup resolves all four at build time, but one of
 * them names a file the package doesn't ship, and the other unused ones add ~5.7 MB of dead
 * chunks. The overlay only uses the default `loader.js`, so the rest are stubbed out here.
 *
 * @returns {import('vite').Plugin}
 */
function jsimguiUnusedLoaders() {
    const stubbed = [
        'loader-extensions.js',
        'loader-freetype.js',
        'loader-freetype-extensions.js',
        'loader-extensions-freetype.js'
    ];

    const prefix = '\0jsimgui-stub:';

    return {
        name: 'jsimgui-unused-loaders',
        enforce: 'pre',
        resolveId: {
            filter: { id: /loader[\w-]*\.js$/ },
            handler(source, importer) {
                if (!importer?.includes('jsimgui')) return;

                const match = stubbed.find((name) => source.endsWith(name));
                return match ? prefix + match : undefined;
            }
        },
        load: {
            filter: { id: /^\0jsimgui-stub:/ },
            handler(id) {
                const name = id.slice(prefix.length);
                return `export default () => { throw new Error("jsimgui's ${name} is not bundled. Remove it from jsimguiUnusedLoaders in astro.config.mjs to enable it."); };`;
            }
        }
    };
}

// https://astro.build/config
export default defineConfig({
    //site: "gradedf.github.io"
    vite: {
        plugins: [jsimguiUnusedLoaders()],
        optimizeDeps: {
            // The dep pre-bundler bypasses the plugin above and would trip over the missing loader.
            exclude: ['@mori2003/jsimgui']
        }
    }
});
