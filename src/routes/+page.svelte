<script>
	import MushafPage from '$lib/components/MushafPage/MushafPage.svelte';
	import Toc from '$lib/components/Toc/Toc.svelte';
	import { user } from '$lib/stores/user';
	import { showToc } from '$lib/stores/main';

	import Landing from '$lib/components/Landing/Index.svelte';
	import Aside from '$lib/components/UserProgress/Aside.svelte';
	import API from '$lib/api/api';
	import { user_segments, blind } from '$lib/stores/main';
	import Swal from 'sweetalert2';

	let showProgressNav = false;
	// Math.floor(Math.random() * (799 - 2 + 1)) + 2;
	let pageNumber = 2;
	let tocDisabled = false;

	function handleSelectPage(page) {
		if (tocDisabled === true) return;
		tocDisabled = true;
		pageNumber = page;
		setTimeout(function () {
			showToc.set(false);
			tocDisabled = false;
		}, 400);

		console.log({ pageNumber });
		Swal.close();
	}

	async function getRandomMission() {
		const mission = await API.get('/missions/random/');
		Swal.fire(mission.question);

		// Swal.fire('?', mission.question, 'success');
		// Swal.fire('Perfect!', 'You Passed This Quiz', 'success');
	}

	async function getRandomProgress() {
		Swal.fire('Retrieving...');
		const segment = await API.get('/users/' + $user.id + '/progress/random');
		console.log({ segment });
		// user_segments.set(segments);
		// const randomSegment = segments[Math.floor(Math.random() * segments.length)];
		blind.set(true);
		// // console.log({ randomSegment });
		handleSelectPage(segment.mushaf_page.page_number);
	}
</script>

{#if !$user}
	<!-- <Creds /> -->
	<Landing />
{:else}
	<MushafPage {pageNumber} />

	{#if $user}
		<i
			class="fa fa-bars open-toc interact"
			on:click={() => {
				showToc.set(true);
				tocDisabled = false;
			}}
		/>

		<i
			class="fa fa-bars progress-nav interact"
			on:click={() => {
				showProgressNav = true;
				tocDisabled = false;
			}}
		/>

		<i
			class="fa fa-gamepad random-progress interact"
			on:click={() => {
				getRandomProgress();
			}}
		/>
		<i
			class="fa fa-gamepad random-mission interact"
			on:click={() => {
				getRandomMission();
			}}
		/>
	{/if}

	{#if showProgressNav}
		<Aside selectPage={handleSelectPage} {tocDisabled} close={() => (showProgressNav = false)} />
	{/if}

	{#if $showToc}
		<Toc selectPage={handleSelectPage} {tocDisabled} />
	{/if}
{/if}

<style>
	.interact {
		color: #f8dec0;
	}

	.open-toc,
	.progress-nav,
	.random-mission,
	.random-progress {
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

	.random-progress {
		left: 60px;
	}

	.progress-nav {
		left: 10px;
	}
</style>
