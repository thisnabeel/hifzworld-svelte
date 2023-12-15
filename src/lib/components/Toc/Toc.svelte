<script>
	import API from '$lib/api/api';
	import { onMount } from 'svelte';

	export let selectPage;
	export let tocDisabled;

	onMount(() => {
		getSurahs();
	});

	let segments = [];
	async function getSurahs() {
		segments = await API.get('/mushafs/' + 1 + '/surahs');
	}
</script>

<ul class="clean-list toc" class:tocDisabled>
	{#each segments as segment}
		<li on:click={() => selectPage(segment.first_page)}>{segment.title}</li>
	{/each}
</ul>

<style>
	.toc {
		position: absolute;
		right: 0;
		top: 0;
		height: 100vh;
		overflow-y: scroll;
		width: 250px;
		text-align: right;
		padding: 40px;
		background-color: #fff;
	}

	.toc li {
		font-size: 34px;
		padding: 10px;
	}

	.toc li:hover {
		background-color: rgb(219, 246, 255);
	}

	.toc.tocDisabled li {
		color: #ccc;
	}

	@media (max-device-width: 667px) and (-webkit-min-device-pixel-ratio: 2) {
		/* Styles specific to iPhones go here */
		.toc {
			width: 100vw;
		}
	}
</style>
