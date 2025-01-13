<script>
	import API from '$lib/api/api';
	import {
		branch,
		user_branch_pages,
		selected_user_page,
		viewingAs,
		loading_branches,
		loading_commits
	} from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';

	let branches;
	export let saveDrawingToDatabase;
	export let saving;

	$: console.log('saving', saving);

	viewingAs.subscribe((payload) => {
		console.log('viewing as', payload.id);
		getBranches(payload);
	});

	async function getBranches(payload) {
		loading_branches.set(true);
		branches = await API.get('/branches/' + payload.id + '/');
		console.log(branches);
		console.log(branches[0]);
		branch.set(branches[0]);
		loading_branches.set(false);
	}

	$: console.log($viewingAs);
</script>

{#if branches}
	<div class="wrapper">
		{#if $user && $user.received_permissions}
			<select name="" id="" class="form-control" bind:value={$viewingAs}>
				<option value={$user}>{$user.first_name + ' ' + $user.last_name} (me)</option>
				{#each $user.received_permissions || [] as grant}
					<option value={grant.granter}
						>{grant.granter.first_name + ' ' + grant.granter.last_name}</option
					>
				{/each}
			</select>
		{/if}
		<div class="flex" class:to-save={saving === -1}>
			{#if $loading_branches}
				<div class="btn btn-block btn-warning" style="display: block; width: 100%;">
					<img src="/spinner.svg" alt="" />
				</div>
			{:else}
				<div class="flex-50 branch-selector">
					<select name="" id="" class="form-control" on:change={(val) => console.log({ val })}>
						{#each branches as branch, index}
							<option value={branch} selected={index === 0}>{branch.title}</option>
						{/each}
					</select>
				</div>
				<div class="flex-50 commit-selector">
					{#if $loading_commits}
						<div class="btn btn-block btn-warning" style="display: block; width: 100%;">
							<img src="/spinner.svg" alt="" />
						</div>
					{:else}
						<div>
							{#if $user_branch_pages && $user_branch_pages.length > 0}
								<div class="flex">
									<div style="flex: 1 1 70%">
										<select
											name=""
											id=""
											class="form-control"
											bind:value={$selected_user_page}
											on:change={() => {
												console.log($selected_user_page);
											}}
										>
											{#each $user_branch_pages as page, index}
												<option value={page} selected={$selected_user_page.id === page.id}
													>{page.created_at}</option
												>
											{/each}
										</select>
									</div>
									<div class="save-btn">
										{#if saving === 0}
											<div
												class="btn btn-block btn-outline-primary saving"
												style="background: #ccc"
											>
												<i class="fa fa-save" />
											</div>
										{:else}
											<div
												class="btn btn-block btn-outline-primary"
												on:click={saveDrawingToDatabase}
											>
												<i class="fa fa-save" />
											</div>
										{/if}
									</div>
								</div>
							{:else if saving === 0}
								<div class="btn btn-block btn-primary" on:click={() => {}}>Saving...</div>
							{:else}
								<div class="btn btn-block btn-outline-primary" on:click={saveDrawingToDatabase}>
									No Commits Yet, Save?
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
			<br /><br />
		</div>
	</div>
{/if}

<style>
	.to-save .branch-selector {
		flex: 1 1 30%;
	}

	.to-save .commit-selector {
		flex: 1 1 85%;
	}

	.to-save .save-btn {
		flex: 1 1 60%;
	}

	.save-btn {
		flex: 1 1 30%;
	}
	.btn-block {
		display: block;
	}
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
