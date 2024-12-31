<script>
	import { page } from '$app/stores';
	import API from '$lib/api/api';
	import Mission from '$lib/components/Missions/Mission.svelte';
	import { onMount } from 'svelte';

	let mission_set;
	let missions = [];
	let newMission = {};

	onMount(async () => {
		mission_set = await API.get('/mission_sets/' + $page.params.id);
		getMissions();
	});

	async function getMissions() {
		missions = await API.get('/mission_sets/' + $page.params.id + '/missions');
	}

	async function addMission() {
		const res = await API.post('/mission_sets/' + $page.params.id + '/missions/', {
			question: newMission.question,
			verse_ref: newMission.verse_ref,
			surah_number: newMission.verse_ref.split(':')[0],
			ayah_number: newMission.verse_ref.split(':')[1],
			mission_set: $page.params.id,
			position: missions.length + 1
		});
		if (res) {
			missions = [...missions, res];
			newMission = {};
		}
	}
</script>

{#if mission_set}
	<h1>
		{mission_set.title}:
	</h1>

	{#each missions as mission}
		<Mission {mission} />
	{/each}

	<div class="row">
		<div class="col-lg-12">
			<input
				placholder="Question..."
				bind:value={newMission.question}
				type="text"
				class="form-control"
			/>
		</div>
		<div class="col-lg-4">
			<input
				placholder="Verse Ref..."
				bind:value={newMission.verse_ref}
				type="text"
				class="form-control"
			/>
		</div>
		<div class="col-lg-4">
			<div on:click={addMission} class="btn btn-info"><i class="fa fa-plus" /></div>
		</div>
	</div>
{/if}

<style>
</style>
