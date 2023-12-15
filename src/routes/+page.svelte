<script>
	import MushafPage from '$lib/components/MushafPage/MushafPage.svelte';
	import Toc from '$lib/components/Toc/Toc.svelte';
	import { user } from '$lib/stores/user';
	import Landing from '$lib/components/Landing/Index.svelte';
	import Aside from '$lib/components/UserProgress/Aside.svelte';
	let showToc = false;
	let showProgressNav = false;
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

{#if !$user}
	<!-- <Creds /> -->
	<Landing />
{:else}
	<MushafPage {pageNumber} />

	{#if $user}
		<i
			class="fa fa-bars open-toc"
			on:click={() => {
				showToc = true;
				tocDisabled = false;
			}}
		/>

		<i
			class="fa fa-bars progress-nav"
			on:click={() => {
				showProgressNav = true;
				tocDisabled = false;
			}}
		/>
	{/if}

	{#if showProgressNav}
		<Aside selectPage={handleSelectPage} {tocDisabled} close={() => (showProgressNav = false)} />
	{/if}

	{#if showToc}
		<Toc selectPage={handleSelectPage} {tocDisabled} />
	{/if}
{/if}

<style>
	.open-toc,
	.progress-nav {
		position: fixed;
		top: 10px;

		font-size: 40px;
	}

	.open-toc {
		right: 10px;
	}

	.progress-nav {
		left: 10px;
	}
</style>
