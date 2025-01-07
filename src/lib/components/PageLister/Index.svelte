<script>
	import API from '$lib/api/api';
	import { current_page_number, current_page } from '$lib/stores/main';
	import { onMount } from 'svelte';
	let firstInput;
	let secondInput;
	let thirdInput;
	let surahNumber;
	let topNumber;
	let bottomNumber;

	onMount(() => {
		if (firstInput) {
			firstInput.focus();
		}
	});

	let topVerse;
	let bottomVerse;

	const handleSubmit = (event) => {
		event.preventDefault(); // Prevents the default form submission
		const suffix = bottomNumber.split('.')[0].split('+')[0];

		if (surahNumber) {
			topVerse = `${surahNumber}:${topNumber}`;
			bottomVerse = `${bottomNumber.includes('+') ? (surahNumber += 1) : surahNumber}:${suffix}`;
		}

		updatePageRef();

		// alert(topVerse, bottomVerse);
		// current_page_number.set($current_page_number + 1);
		// topNumber = '';
		// bottomNumber = '';

		// if (secondInput) {
		// 	secondInput.focus();
		// }
	};

	async function updatePageRef() {
		await API.put(`/mushaf_pages/${$current_page.id}/`, {
			mushaf: $current_page.mushaf,
			verse_ref_start: topVerse,
			verse_ref_end: bottomVerse
		});
		current_page_number.set($current_page_number + 1);

		if (bottomNumber.includes('.')) {
			topNumber = parseInt(bottomNumber.split('.')[0]) + 1;
			bottomNumber = '';
			thirdInput.focus();
		} else if (bottomNumber.includes('+')) {
			topNumber = parseInt(bottomNumber.split('+')[0]);
			bottomNumber = '';
			thirdInput.focus();
		} else {
			topNumber = bottomNumber;
			bottomNumber = '';
			thirdInput.focus();
		}
	}
</script>

<div class="page-lister">
	<form on:submit={handleSubmit}>
		<input
			type="number"
			class="form-control"
			placeholder="Surah..."
			bind:value={surahNumber}
			bind:this={firstInput}
		/>
		<input
			type="text"
			class="form-control"
			bind:value={topNumber}
			bind:this={secondInput}
			placeholder="Top..."
		/>
		<input
			type="text"
			class="form-control"
			bind:value={bottomNumber}
			bind:this={thirdInput}
			placeholder="Bottom..."
		/>
		<button type="submit" class="form-control btn btn-primary">Save</button>
	</form>
</div>

<style>
	.page-lister {
		position: absolute;
		top: 0;
		right: 0;
	}
</style>
