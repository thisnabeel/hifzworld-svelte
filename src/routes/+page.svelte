<script>
	import MushafPage from '$lib/components/MushafPage/MushafPage.svelte';
	import Toc from '$lib/components/Toc/Toc.svelte';
	import { user } from '$lib/stores/user';

	let showToc = false;
	// Math.floor(Math.random() * (799 - 2 + 1)) + 2;
	let pageNumber = 2;
	let tocDisabled = false;

	function handleSelectPage(page) {
		if (tocDisabled === true) return;
		tocDisabled = true;
		pageNumber = page;
		setTimeout(function () {
			showToc = false;
			tocDisabled = false;
		}, 400);

		console.log({ pageNumber });
	}
</script>

<MushafPage {pageNumber} />

{#if $user}
	<i
		class="fa fa-bars open-toc"
		on:click={() => {
			showToc = true;
			tocDisabled = false;
		}}
	/>
{/if}

{#if showToc}
	<Toc selectPage={handleSelectPage} {tocDisabled} />
{/if}

<style>
	.open-toc {
		position: fixed;
		top: 10px;
		right: 10px;
		font-size: 40px;
	}
</style>
