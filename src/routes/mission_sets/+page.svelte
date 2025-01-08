<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import { onMount } from 'svelte';

	export let mission_sets;
	let newMissionSetTitle;

	async function createMissionSet() {
		const res = await API.post(`/mission_sets/`, {
			title: newMissionSetTitle,
			position: mission_sets.length + 1
		});

		console.log(res);
		mission_sets = [...mission_sets, res];
		newMissionSetTitle = '';
	}

	onMount(async () => {
		mission_sets = await API.get('/mission_sets/');
	});
</script>

<h1>Mission Sets:</h1>
{#each mission_sets || [] as set}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<li
		on:click={() => {
			goto(`/mission_sets/${set.id}/missions`);
		}}
	>
		{set.title}
	</li>
{/each}
<input type="text" class="form-control" bind:value={newMissionSetTitle} />
<div class="btn btn-info" on:click={createMissionSet}>
	<i class="fa fa-plus" />
</div>

<style>
</style>
