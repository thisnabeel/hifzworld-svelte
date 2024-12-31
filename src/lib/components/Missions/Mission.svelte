<script>
	import API from '$lib/api/api';

	export let mission;
	let editing;

	async function save() {
		console.log(mission);
		mission = {
			...mission,
			surah_number: mission.verse_ref.split(':')[0],
			ayah_number: mission.verse_ref.split(':')[1]
		};
		await API.put(`/missions/${mission.id}/`, mission);
		editing = false;
	}
</script>

{#if mission}
	{#if !editing}
		<li>
			{mission.question}
			<div class="btn btn-outline-warning" on:click={() => (editing = !editing)}>
				<i class="fa fa-edit" />
			</div>
		</li>
	{:else}
		<li>
			<div class="btn btn-outline-warning" on:click={() => (editing = !editing)}>
				<i class="fa fa-edit" />
			</div>
			<input
				type="text"
				placeholder="Question"
				class="form-control"
				bind:value={mission.question}
			/>
			<input
				type="text"
				placeholder="Verse Ref"
				class="form-control"
				bind:value={mission.verse_ref}
			/>
			<div class="btn btn-primary" on:click={save}>Save</div>
		</li>
	{/if}
{/if}

<style>
	li {
		/* background-color: aqua; */
		padding: 2em;
		margin: 10px 0;
	}
</style>
