<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import { onMount } from 'svelte';

	export let mission_sets;
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

<style>
</style>
