<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import { debounce } from '$lib/functions/debounceBasic';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';

	let emailInput;
	let searching = false;
	let searchResults = [];

	let otherSide = null;

	onMount(() => {
		getList();
	});

	async function getOtherSide(u) {
		const res = await API.get(`/users/${u.id}`);
		otherSide = res;
		console.log({ otherSide });
	}

	async function getList() {
		const list = await API.get(`/user_grants/?email=${$user.email}`);
		console.log(list);
		console.log(list.granted_permissions);
		user.set({
			...$user,
			granted_permissions: list.granted_permissions,
			received_permissions: list.received_permissions
		});
	}

	// $: console.log($user);

	async function grantAccess(email) {
		const res = await API.post('/user_grants/', {
			granter_email: $user.email,
			grantee_email: email,
			access_type: 'full'
		});

		user.set({ ...$user, granted_permsissions: [...($user.granted_permissions || []), res] });
		getList();
	}

	const searchByEmail = debounce(async () => {
		if (emailInput.includes('@')) {
			searching = true;
			try {
				searchResults = await API.get(`/users/search?email=${emailInput}`);
				console.log({ searchResults });
			} catch (error) {
				searchResults = [];
				console.error('Error searching for user:', error);
			} finally {
				searching = false;
			}
		} else {
			searchResults = [];
		}
	}, 300);
</script>

<div class="wrapper">
	<h1>Grant Access:</h1>

	<input
		type="text"
		class="form-control"
		placeholder="Enter Account Email to Grant Access..."
		bind:value={emailInput}
		on:keyup={searchByEmail}
	/>
	{#if searching}
		<div class="btn btn-primary btn-block">Searching...</div>
	{/if}

	{#if searchResults}
		<br />
		<div class="clean-list search-results">
			{#each searchResults as result}
				<li>
					{result.first_name}
					{result.last_name}, {result.email}

					<div
						class="btn btn-outline-primary pull-right"
						on:click={() => grantAccess(result.email)}
					>
						<i class="fa fa-plus" />
					</div>
				</li>
			{/each}
		</div>
	{/if}

	{#if $user}
		<div class="flex">
			<div class="flex-50">
				<h1>Granted Permissions</h1>
				<p>They can mark your mistakes</p>
				<ul class="clean-list">
					{#each $user.granted_permissions || [] as grant}
						<li class="user" on:click={() => getOtherSide(grant.grantee)}>
							{grant.grantee.first_name}
							{grant.grantee.last_name}
						</li>
					{/each}
				</ul>
			</div>
			<div class="flex-50">
				<h1>Received Permissions</h1>
				<p>You can mark their mistakes</p>
				<ul class="clean-list">
					{#each $user.received_permissions || [] as grant}
						<li class="user" on:click={() => getOtherSide(grant.granter)}>
							{grant.granter.first_name}
							{grant.granter.last_name}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	.search-results li {
		display: flex;
		justify-content: space-between;
		padding: 12px;
		background: #eee;
	}
	.search-results {
	}
	.wrapper {
		/* max-width: 500px; */
		/* margin: 0 auto; */
		display: block;
	}

	.flex-50 {
		padding: 10px;
	}

	.user {
		background-color: #e7ffd1;
		border: 1px solid #fff;
		padding: 10px;
	}
</style>
