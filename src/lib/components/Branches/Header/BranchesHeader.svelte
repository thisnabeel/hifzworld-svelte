<script>
	import API from '$lib/api/api';
	import { branch, user_branch_pages, selected_user_page } from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';

	let branches;

	onMount(async () => {});

	user.subscribe((payload) => {
		getBranches(payload);
	});

	async function getBranches(payload) {
		branches = await API.get('/branches/' + payload.id + '/');
		console.log(branches);
		branch.set(branches[0]);
	}
</script>

{#if branches}
	<div class="wrapper">
		<div class="flex">
			<div class="flex-50">
				<select name="" id="" class="form-control" on:change={(val) => console.log({ val })}>
					{#each branches as branch, index}
						<option value={branch} selected={index === 0}>{branch.title}</option>
					{/each}
				</select>
			</div>
			<div class="flex-50">
				<select
					name=""
					id=""
					class="form-control"
					bind:value={$selected_user_page}
					on:change={() => {
						console.log($selected_user_page);
					}}
				>
					{#if $user_branch_pages}
						{#each $user_branch_pages as page, index}
							<option value={page} selected={$selected_user_page.id === page.id}
								>{page.created_at}</option
							>
						{/each}
					{/if}
				</select>
			</div>
			<br /><br />
		</div>
	</div>
{/if}

<style>
	.wrapper {
		margin: 0px auto;
		width: 400px;
		display: block;
	}
	.flex {
		display: flex;
	}

	.flex-50 {
		flex: 1 1 50%;
	}
</style>
