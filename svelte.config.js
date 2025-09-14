import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-vercel is optimized for Vercel deployments
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			runtime: 'nodejs18.x'
		})
	}
};

export default config;
