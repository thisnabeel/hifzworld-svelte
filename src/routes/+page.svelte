<script>
	import MushafPage from '$lib/components/MushafPage/MushafPage.svelte';
	import Toc from '$lib/components/Toc/Toc.svelte';
	import { user } from '$lib/stores/user';
	import Landing from '$lib/components/Landing/Index.svelte';
	import Aside from '$lib/components/UserProgress/Aside.svelte';
	import API from '$lib/api/api';

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

	async function getRandomMission() {
		const mission = await API.get('/missions/random/');
		Swal.fire(mission.question);

		// Swal.fire('?', mission.question, 'success');
		// Swal.fire('Perfect!', 'You Passed This Quiz', 'success');
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
		<i
			class="fa fa-bullseye random-mission"
			on:click={() => {
				getRandomMission();
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
	.progress-nav,
	.random-mission {
		position: fixed;
		top: 10px;

		font-size: 40px;
	}

	.open-toc {
		right: 10px;
	}

	.random-mission {
		right: 60px;
	}

	.progress-nav {
		left: 10px;
	}
</style>
