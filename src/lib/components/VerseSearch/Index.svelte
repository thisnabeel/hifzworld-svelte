<script>
	import API from '$lib/api/api';
	import { current_page, current_page_number, showVerseRefSearcher } from '$lib/stores/main';
	let verse_ref;
	import fetchPageByVerse from '$lib/functions/fetchPageByVerse';
	import PopQuizModal from '../Modals/PopQuizModal.svelte';
	import { openModal } from 'svelte-modals';

	// find_page/<int:mushaf_id>/<int:verse_verse_ref>
</script>

{#if $showVerseRefSearcher}
	<div class="wrapper">
		<i class="fa fa-times close" on:click={() => showVerseRefSearcher.set(false)} />
		<input type="text" class="form-control" placeholder="Verse ref..." bind:value={verse_ref} />
		<div class="btn btn-info" on:click={() => fetchPageByVerse(verse_ref)}>
			<i class="fa fa-search" />
		</div>
	</div>
{/if}

<style>
	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	/* Center the wrapper on the page */
	.wrapper {
		position: fixed;
		top: 25%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 2em;
		background-color: #fff;
		width: 350px;
		z-index: 9999;
		border: 1px solid #ccc;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center; /* Center content inside the wrapper */
	}
</style>
