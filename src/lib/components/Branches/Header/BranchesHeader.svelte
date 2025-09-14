<script>
	import API from '$lib/api/api';
	import {
		branch,
		user_branch_pages,
		selected_user_page,
		viewingAs,
		loading_branches,
		loading_commits,
		current_page_number
	} from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import { onMount, onDestroy } from 'svelte';

	/** @type {any[]} */
	let branches;
	/** @type {any[]} */
	let juzSegments = [];
	export let saveDrawingToDatabase;
	export let saving;

	$: console.log('saving', saving);

	let previousViewingAs = null; // Store the previous value

	const unsubscribeViewingAs = viewingAs.subscribe((/** @type {any} */ payload) => {
		if (payload && payload.id) {
			console.log('viewing as changed to', payload.id);
			getBranches(payload);
		}
	});

	// Ensure to unsubscribe when component is destroyed
	onDestroy(() => {
		unsubscribeViewingAs();
	});

	// function handleViewingAsChange(event) {
	// 	const newValue = event.target.value;
	// 	if ($viewingAs.id !== newValue) {
	// 		viewingAs.set(newValue);
	// 		console.log('viewing as changed to', newValue);
	// 		getBranches(newValue);
	// 	}
	// }

	/** @param {any} payload */
	async function getBranches(payload) {
		loading_branches.set(true);
		branches = await API.get('/branches/' + payload.id + '/');
		console.log(`${payload.email}`, branches);
		console.log(branches[0]);
		branch.set(branches[0]);
		loading_branches.set(false);
	}

	async function getJuzSegments() {
		try {
			juzSegments = await API.get('/mushafs/1/juzs');
		} catch (error) {
			console.error('Error fetching Juz segments:', error);
		}
	}

	/** @param {any} juzSegment */
	function navigateToJuz(juzSegment) {
		current_page_number.set(juzSegment.first_page + 1);
	}

	onMount(() => {
		getJuzSegments();
	});

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

		<!-- Juz Navigation -->
		{#if juzSegments.length > 0}
			<div class="juz-navigation">
				<div class="juz-scroll-container">
					{#each juzSegments as juz}
						<button class="juz-item" on:click={() => navigateToJuz(juz)} title="Go to {juz.title}">
							{juz.title}
						</button>
					{/each}
				</div>
			</div>
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
							{#if $user_branch_pages && Array.isArray($user_branch_pages) && $user_branch_pages.length > 0}
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
												<option
													value={page}
													selected={$selected_user_page && $selected_user_page.id === page.id}
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
											<button
												class="btn btn-block btn-outline-primary"
												on:click={saveDrawingToDatabase}
											>
												<i class="fa fa-save" />
											</button>
										{/if}
									</div>
								</div>
							{:else if saving === 0}
								<button class="btn btn-block btn-primary" disabled>Saving...</button>
							{:else}
								<button class="btn btn-block btn-outline-primary" on:click={saveDrawingToDatabase}>
									No Commits Yet, Save?
								</button>
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

	.juz-navigation {
		margin-bottom: 20px;
	}

	.juz-scroll-container {
		display: flex;
		overflow-x: auto;
		gap: 8px;
		padding: 8px 0;
		scrollbar-width: thin;
		scrollbar-color: #ccc transparent;
		direction: rtl;
	}

	.juz-scroll-container::-webkit-scrollbar {
		height: 4px;
	}

	.juz-scroll-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.juz-scroll-container::-webkit-scrollbar-thumb {
		background: #ccc;
		border-radius: 2px;
	}

	.juz-scroll-container::-webkit-scrollbar-thumb:hover {
		background: #aaa;
	}

	.juz-item {
		flex-shrink: 0;
		padding: 6px 12px;
		border: 1px solid #ddd;
		background: #fff;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		color: #333;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		direction: ltr;
	}

	.juz-item:hover {
		background: #f8f9fa;
		border-color: #007bff;
		color: #007bff;
	}

	.juz-item:active {
		background: #e9ecef;
		transform: translateY(1px);
	}
</style>
