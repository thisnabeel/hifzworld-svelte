<script>
	import { page } from '$app/stores';
	import setUserBoundary from '$lib/functions/setUserBoundary';
	import { showToc } from '$lib/stores/main';
	import { user } from '$lib/stores/user';

	export let group;
	let expand = false;
	export let selectPage;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	on:click={() => {
		// selectPage(report.mushaf_page.page_number);
		// close();
	}}
	class:expand
>
	<div class="report">
		<div class="flex">
			<div class="flex-40">
				<div
					on:click={() => (expand = !expand)}
					class="markings"
					class:hot={group.densityClass === 'hot'}
					class:medium={group.densityClass === 'medium'}
					class:mild={group.densityClass === 'mild'}
					class:good={group.densityClass === 'good'}
				>
					{group.markings}
				</div>
			</div>
			<div class="flex-60">
				<div class="title" style="direction:rtl">
					<div>
						{group.title}
					</div>
					<small
						class="totalPages"
						on:click={() => {
							// setUserBoundaryByPage(group.surah.first_page, group.surah.last_page);
						}}
						>Surah Pgs: {group.totalPages}
						<!-- <i
							class="fa fa-lock"
							class:locked={$user.starting_verse_boundary &&
								$user.ending_verse_boundary &&
								$user.starting_verse_boundary === group.surah.first_page &&
								$user.ending_verse_boundary === group.surah.last_page}
						/> -->
					</small>
					<br />
				</div>
			</div>
		</div>
	</div>

	{#if expand}
		<ul class="clean-list pages">
			{#each [...group.pages].sort((a, b) => a.mushaf_page.page_number - b.mushaf_page.page_number) as page}
				<li
					class="page"
					on:click={() => {
						selectPage(page.mushaf_page.page_number);
					}}
				>
					<h1>
						{page.markings}
					</h1>
					<span>pg. {page.mushaf_page.page_number}</span>
				</li>
			{/each}
		</ul>
	{/if}
</li>

<style>
	.fa-lock {
		color: #ccc;
	}
	.page:hover {
		background-color: #d1e4ff;
	}

	.pages {
		display: inline;
		overflow-x: scroll;
		display: flex;
		flex-direction: row-reverse; /* Reverse the order of items */
		flex-wrap: nowrap; /* Allow items to wrap to the next line */
		gap: 10px; /* Optional spacing between items */
	}

	.pages .page {
		text-wrap: nowrap;
		cursor: pointer;
		text-align: center;
		display: inline-block;
		direction: rtl;
		width: max-content;
		padding: 10px;
		margin: 5px;
		border: 1px solid #ccc;
		border-radius: 10px;
	}

	.page h1 {
		font-size: 22px;
	}

	.expand {
		background: #f1eeee;
	}
	.totalPages {
		color: #414141;
		font-size: 14px;
		text-wrap: nowrap;
	}
	.title {
		direction: rtl;
		text-align: right;
		font-size: 28px;
	}

	.report {
		text-align: right;
		padding: 10px 16px;
		margin: 10px 0px;
		border-bottom: 1px solid #ccc;
	}
	.markings {
		text-align: center;
		font-size: 30px;
		background-color: #000;
		color: #fff;
	}

	.markings.hot {
		background: #ff1010;
	}

	.markings.medium {
		background: #ffab10;
	}

	.markings.mild {
		background: #ffff52;
		color: #000;
	}

	.markings.good {
		background: rgb(123, 255, 141);
		color: #000;
	}
	.report .close {
		position: absolute;
		top: 4px;
		left: 4px;
	}
	.toc {
		position: fixed;
		left: 0;
		top: 0;
		height: 100vh;
		overflow-y: scroll;
		width: 250px;
		text-align: right;
		padding: 40px;
		background-color: #fff;
		border-right: 1px solid #000;
	}

	.toc li {
		padding: 10px;
	}

	.toc li:hover {
		background-color: rgb(219, 246, 255);
	}

	.toc.tocDisabled li {
		color: #ccc;
	}

	@media (max-device-width: 667px) and (-webkit-min-device-pixel-ratio: 2) {
		/* Styles specific to iPhones go here */
		.toc {
			width: 100vw;
			z-index: 9999;
		}
		.title {
			font-size: 42px;
		}

		.pages {
			display: inline;
			overflow-x: scroll;
			display: flex;
			flex-direction: row-reverse; /* Reverse the order of items */
			flex-wrap: nowrap; /* Allow items to wrap to the next line */
			gap: 10px; /* Optional spacing between items */
		}

		.pages .page {
			text-align: center;
			display: inline-block;
			direction: rtl;
			width: max-content;
			padding: 20px;
			margin: 10px;
			border: 1px solid #ccc;
			border-radius: 10px;
		}

		.totalPages {
			font-size: 22px;
		}
	}
</style>
