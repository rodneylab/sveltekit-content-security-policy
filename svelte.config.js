/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-static';
import { imagetools } from 'vite-imagetools';
import { mdsvex } from 'mdsvex';
import preprocess from 'svelte-preprocess';
import cspDirectives from './csp-directives.mjs';

const config = {
  extensions: ['.svelte', '.md', '.svelte.md'],
  preprocess: [
    mdsvex({ extensions: ['.svelte.md', '.md', '.svx'] }),
    preprocess({
      scss: {
        prependData: "@import 'src/lib/styles/variables.scss';",
      },
    }),
  ],
  kit: {
    adapter: adapter({ precompress: true }),
    csp: {
      mode: 'hash',
      directives: cspDirectives,
    },
    files: {
      hooks: 'src/hooks',
    },
    prerender: { default: true },
    vite: {
      define: {
        'process.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
      },
      plugins: [imagetools({ force: true })],
    },
  },
};

export default config;
