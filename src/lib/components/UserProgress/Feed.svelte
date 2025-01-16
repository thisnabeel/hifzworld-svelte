<script>
	import { user_segments } from '$lib/stores/main';

	export let selectPage;
</script>

{#each $user_segments as report}
	<li
		on:click={() => {
			selectPage(report.mushaf_page.page_number);
		}}
	>
		<div class="report">
			<div class="flex">
				<div class="flex-40">
					<div
						class="markings"
						class:hot={report.markings >= 3}
						class:medium={report.markings < 3 && report.markings > 1}
						class:mild={report.markings === 1}
						class:good={report.markings === 0}
					>
						{report.markings}
					</div>
				</div>
				<div class="flex-60">
					<div class="title" style="direction:rtl">{report.title}</div>
				</div>
			</div>
			<div class="last_touched">{report.last_touched}</div>
		</div>
	</li>
{/each}

<style>
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
			font-size: 32px;
		}
	}
</style>
