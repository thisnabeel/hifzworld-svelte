<script>
	import MushafPage from '$lib/components/MushafPage/MushafPage.svelte';
	import Toc from '$lib/components/Toc/Toc.svelte';
	import { user } from '$lib/stores/user';
	import { showToc } from '$lib/stores/main';
	import { openModal } from 'svelte-modals';
	import PopQuizModal from '../Modals/PopQuizModal.svelte';
	import Landing from '$lib/components/Landing/Index.svelte';
	import Aside from '$lib/components/UserProgress/Aside.svelte';
	import API from '$lib/api/api';
	import { user_segments, blind, current_page_number } from '$lib/stores/main';
	import { goto } from '$app/navigation';

	import fetchPageByVerse from '$lib/functions/fetchPageByVerse';

	let showProgressNav = false;
	// Math.floor(Math.random() * (799 - 2 + 1)) + 2;
	let pageNumber = 2;
	let tocDisabled = false;

	function handleSelectPage(page) {
		if (tocDisabled === true) return;
		tocDisabled = true;
		// pageNumber = page;
		current_page_number.set(page);
		setTimeout(function () {
			showToc.set(false);
			tocDisabled = false;
		}, 400);

		Swal.close();
	}

	async function getRandomMission() {
		const mission = await API.get('/missions/random/');
		// Swal.fire(mission.question);

		openModal(PopQuizModal, { mission: mission });

		// Swal.fire({
		// 	title: 'Pop Quiz',
		// 	text: mission.question,
		// 	showCancelButton: true,
		// 	confirmButtonColor: '#3085d6',
		// 	cancelButtonColor: '#d33',
		// 	confirmButtonText: 'Show Me!'
		// }).then((result) => {
		// 	if (result.isConfirmed) {
		// 		// console.log(mission);

		// 		fetchPageByVerse(mission.verse_ref);
		// 	}
		// });

		// Swal.fire('?', mission.question, 'success');
		// Swal.fire('Perfect!', 'You Passed This Quiz', 'success');
	}

	async function getRandomProgress() {
		Swal.fire({
			title: 'Shuffling Marked Pages...',
			text: 'Please hold...',
			showConfirmButton: false
		});
		const segment = await API.get(
			'/users/' + $user.id + '/progress/random/' + $current_page_number
		);
		console.log({ segment });
		// user_segments.set(segments);
		// const randomSegment = segments[Math.floor(Math.random() * segments.length)];
		blind.set(true);
		// // console.log({ randomSegment });
		handleSelectPage(segment.mushaf_page.page_number);
		// current_page_number.set(segment.mushaf_page.page_number);
	}
</script>

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
		class="fa fa-dice random-progress interact"
		on:click={() => {
			goto('/');
			getRandomProgress();
		}}
	/>
	<i
		class="fa fa-dice random-mission interact"
		on:click={() => {
			goto('/');
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
