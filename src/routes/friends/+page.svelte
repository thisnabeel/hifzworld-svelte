<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import { debounce } from '$lib/functions/debounceBasic';
	import { user } from '$lib/stores/user';

	let emailInput;
	let searching = false;
	let searchResults = [];

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
	<h1>Friends:</h1>

	<input
		type="text"
		class="form-control"
		placeholder="Enter Account Email..."
		bind:value={emailInput}
		on:keyup={searchByEmail}
	/>
	{#if searching}
		<div class="btn btn-primary btn-block">Searching...</div>
	{/if}

	{#if searchResults}
		<div class="clean-list search-results">
			{#each searchResults as result}
				<li>
					{result.first_name}
					{result.last_name}, {result.email}

					<div class="btn btn-outline-primary pull-right">
						<i class="fa fa-plus" />
					</div>
				</li>
			{/each}
		</div>
	{/if}

	<table class="table" />
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
		max-width: 500px;
		/* margin: 0 auto; */
		display: block;
	}
</style>
