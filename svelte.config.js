import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-node creates a standalone Node server.
		// See https://svelte.dev/docs/kit/adapter-node for more information.
		adapter: adapter()
	}
};

export default config;
