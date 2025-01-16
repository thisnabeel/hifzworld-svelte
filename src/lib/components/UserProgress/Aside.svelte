<script>
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';
	import { user_segments } from '$lib/stores/main';
	import Feed from './Feed.svelte';
	import Grouped from './Grouped.svelte';
	import { action } from 'svelte-modals';

	export let selectPage;
	export let tocDisabled;
	export let close;

	let tab = 'feed';

	onMount(() => {
		getUserProgress();
	});

	async function getUserProgress() {
		const segments = await API.get('/users/' + $user.id + '/progress_reports');
		segments.sort((a, b) => {
			if (a.markings !== b.markings) {
				return b.markings - a.markings; // Sort markings descending
			}
			return new Date(a.updated_at) - new Date(b.updated_at); // Sort updated_at ascending
		});
		console.log(segments);
		user_segments.set(segments);
	}
</script>

<ul class="clean-list toc" class:tocDisabled>
	<div>
		<div>
			<h3>Progress:</h3>
			<div class="tabs flex">
				<div class="flex-50" on:click={() => (tab = 'feed')} class:active={tab === 'feed'}>
					Feed
				</div>
				<div class="flex-50" on:click={() => (tab = 'grouped')} class:active={tab === 'grouped'}>
					Grouped
				</div>
			</div>
		</div>
	</div>
	<div class="close" on:click={close}><i class="fa fa-times" /></div>
	<hr />

	{#if tab === 'feed'}
		<Feed selectPage={(payload) => selectPage(payload)} />
	{/if}
	{#if tab === 'grouped'}
		<Grouped selectPage={(payload) => selectPage(payload)} />
	{/if}
</ul>

<style>
	.toc h3 {
		text-align: left;
	}
	.tabs {
		text-align: center;
	}

	.tabs .active {
		background-color: #000;
		color: #fff;
	}
	.flex {
		display: flex;
		justify-content: space-between;
	}

	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}
	.title {
		direction: rtl;
		text-align: right;
		font-size: 28px;
	}

	.report {
		text-align: right;
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
		padding: 6px;
		background-color: #fff;
		border-right: 1px solid #000;
		z-index: 999;
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
			padding: 20px;
		}

		.title {
			font-size: 32px;
		}
	}
</style>
