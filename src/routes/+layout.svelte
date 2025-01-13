<script>
	import Header from './Header.svelte';
	import '../app.css';

	import Creds from '$lib/components/Creds/Creds.svelte';
	import { user } from '$lib/stores/user';
	import Landing from '$lib/components/Landing/Index.svelte';

	import { Modals, closeModal } from 'svelte-modals';
	import { fade } from 'svelte/transition';
	import { showVerseRefSearcher, showStats, viewingAs } from '$lib/stores/main';
	import VerseSearch from '$lib/components/VerseSearch/Index.svelte';
	import Stats from '$lib/components/Stats/Index.svelte';

	user.subscribe((user) => console.log(user));
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
	/>
</svelte:head>

<div class="app" class:viewingAs={$user && $viewingAs && $viewingAs.id !== $user.id}>
	<Header />

	{#if $showVerseRefSearcher}
		<VerseSearch />
	{/if}
	{#if $showStats}
		<Stats />
	{/if}

	<main>
		<slot />
		<Modals>
			<div slot="backdrop" class="backdrop" transition:fade on:click={closeModal} />
		</Modals>
	</main>

	<footer>
		<!-- <p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p> -->
	</footer>
</div>

<style>
	.viewingAs {
		background-color: #fff1cf;
	}

	/* .backdrop {
		height: 100%;
		width: 100%;
		display: block;
		position: absolute;
		z-index: 999;
		top: 0;
		left: 0;
		background: rgba(0, 0, 0, 0.5);
	} */
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
