<script>
	import { page } from '$app/stores';
	import API from '$lib/api/api';
	import { onMount } from 'svelte';

	let title;
	let first_page;
	let last_page;
	let segments = [];

	onMount(() => {
		getSegments();
	});

	async function getSegments() {
		segments = await API.get('/mushafs/' + $page.params.id + '/mushaf_segments');
	}

	async function submit() {
		const res = await API.post('/mushaf_segments', {
			category: 'surah',
			category_position: segments.length + 1,
			title: title,
			first_page: first_page,
			last_page: last_page,
			mushaf: 1
		});
		console.log({ res });
		segments = [...segments, res];
	}
</script>

<h1>Mushaf Segments</h1>

<div class="group">
	<input type="text" class="form-control" placeholder="Title..." bind:value={title} />
	<div class="flex">
		<div>
			<input type="number" class="form-control" placeholder="First Page" bind:value={first_page} />
		</div>
		<div>
			<input type="number" class="form-control" placeholder="Last Page" bind:value={last_page} />
		</div>
	</div>

	<div class="d-grid">
		<div class="btn btn-outline-info btn-block" on:click={submit}>Add</div>
	</div>
</div>

<div>
	<ul class="clean-list segments">
		{#each segments as segment}
			<li class="flex">
				<h1>{segment.title}</h1>
				<h1>{segment.first_page}-{segment.last_page}</h1>
			</li>
		{/each}
	</ul>
</div>

<style>
	.flex {
		display: flex;
	}
	.flex > * {
		flex: 1 1;
	}
</style>
