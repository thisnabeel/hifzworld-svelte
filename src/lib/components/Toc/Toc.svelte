<script>
	import API from '$lib/api/api';
	import { showToc, tocList } from '$lib/stores/main';
	import { onMount } from 'svelte';
	import getTocList from '$lib/functions/getTocList';

	export let selectPage;
	export let tocDisabled;

	onMount(() => {
		getTocList();
	});
</script>

<ul class="clean-list toc" class:tocDisabled>
	{#each $tocList as segment}
		<li on:click={() => selectPage(segment.first_page)}>{segment.title}</li>
	{/each}
	<div
		class="fa fa-close close"
		on:click={() => {
			showToc.set(false);
		}}
	/>
</ul>

<style>
	.toc {
		position: fixed;
		right: 0;
		top: 0;
		height: 100vh;
		overflow-y: scroll;
		width: 250px;
		text-align: right;
		padding: 40px;
		background-color: #fff;
		border-left: 1px solid #000;
		z-index: 99999;
	}

	.close {
		position: fixed;
		right: 10px;
		top: 10px;
		z-index: 99999;
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
			z-index: 9999;
		}
	}
</style>
