<script>
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';

	export let selectPage;
	export let tocDisabled;
	export let close;

	onMount(() => {
		getUserProgress();
	});

	let segments = [];
	async function getUserProgress() {
		segments = await API.get('/users/' + $user.id + '/progress');
	}
</script>

<ul class="clean-list toc" class:tocDisabled>
	<div class="close" on:click={close}><i class="fa fa-times" /></div>
	<h1>My Progress</h1>
	{#each segments as segment}
		<li
			on:click={() => {
				selectPage(segment.page_number);
				close();
			}}
		>
			<div style="direction:ltr">
				{segment.percentage}%
				<span style="direction:rtl">{segment.title}</span>
			</div>
		</li>
	{/each}
</ul>

<style>
	.close {
		position: absolute;
		top: 4px;
		left: 4px;
	}
	.toc {
		position: absolute;
		left: 0;
		top: 0;
		height: 100vh;
		overflow-y: scroll;
		width: 250px;
		text-align: right;
		padding: 40px;
		background-color: #fff;
	}

	.toc li {
		font-size: 34px;
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
		}
	}
</style>
