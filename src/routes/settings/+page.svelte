<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';

	let starting_verse_boundary = '';
	let ending_verse_boundary = '';

	onMount(() => {
		starting_verse_boundary = $user.starting_verse_boundary;
		ending_verse_boundary = $user.ending_verse_boundary;
	});

	async function saveBoundaries() {
		const res = await API.patch('users/' + $user.id + '/update/', {
			starting_verse_boundary: starting_verse_boundary,
			ending_verse_boundary: ending_verse_boundary
		});
		user.set({
			...$user,
			starting_verse_boundary: starting_verse_boundary,
			ending_verse_boundary: ending_verse_boundary
		});
	}
</script>

<div class="wrapper">
	<h1>Settings:</h1>

	<table class="table">
		<tr />
		<tr>
			<td><i class="fa fa-lock" />Tester Lock:</td>
			<td
				><div class="flex">
					<div class="flex-50">
						<input
							type="text"
							class="form-control"
							on:keyup={saveBoundaries}
							bind:value={starting_verse_boundary}
							placeholder="Starting Verse"
						/>
					</div>
					<div class="flex-50">
						<input
							type="text"
							class="form-control"
							on:keyup={saveBoundaries}
							bind:value={ending_verse_boundary}
							placeholder="Ending Verse"
						/>
					</div>
				</div></td
			>
		</tr>
		<tr>
			<td>Timezone:</td>
			<td
				><select name="" id="" class="form-control">
					<option value="">PST</option>
				</select>
			</td>
		</tr>
		<tr>
			<td>
				<div
					class="btn btn-block btn-outline-danger"
					on:click={() => {
						user.set(null);
						goto('/');
					}}
				>
					Sign Out
				</div>
			</td>
		</tr>
	</table>
</div>

<style>
	.wrapper {
		max-width: 500px;
		/* margin: 0 auto; */
		display: block;
	}
</style>
