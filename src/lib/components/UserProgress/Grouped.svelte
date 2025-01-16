<script>
	import { user_segments } from '$lib/stores/main';
	import { tocList } from '$lib/stores/main'; // Import $tocList
	import Group from './Group.svelte';

	export let selectPage;
	let groupings = [];

	user_segments.subscribe((payload) => {
		groupings = groupAndOrderByDensity(payload, $tocList);
	});

	function groupAndOrderByDensity(data, tocList) {
		// Group by title with total markings
		const grouped = data.reduce((grouped, item) => {
			const title = item.title;
			if (!grouped[title]) {
				grouped[title] = { pages: [], markings: 0 };
			}
			grouped[title].pages.push(item);
			grouped[title].markings += item.markings;
			return grouped;
		}, {});

		// Map group to Surah and calculate density
		const densityValues = [];
		const sortedGroups = Object.entries(grouped).map(([title, group]) => {
			// Find the Surah in tocList by title
			const surah = tocList.find((toc) => toc.title === title);

			// Calculate total pages for the Surah
			const totalPages = surah ? surah.last_page - surah.first_page + 1 : 1; // Default to 1 if not found

			// Calculate density
			const density = group.markings / totalPages;
			const density_percentage = Math.round(density * 100) / 100;

			densityValues.push(density_percentage);

			return {
				title,
				...group,
				totalPages,
				density,
				density_percentage,
				surah
			};
		});

		// Find the highest and lowest density for scaling
		const maxDensity = Math.max(...densityValues);
		const minDensity = Math.min(...densityValues);

		// Scale densities to calculate dynamic styling classes
		const groupsWithScaledDensities = sortedGroups.map((group) => {
			const scaledValue = (group.density_percentage - minDensity) / (maxDensity - minDensity || 1); // Prevent division by zero
			const densityClass = mapDensityToClass(scaledValue); // Map scaled value to class
			return {
				...group,
				scaledDensity: scaledValue, // Normalized between 0 and 1
				densityClass
			};
		});

		// Sort by actual density for display
		return groupsWithScaledDensities.sort((a, b) => b.density - a.density);
	}

	function mapDensityToClass(scaledDensity) {
		// Map the scaled density to the original classes
		if (scaledDensity >= 0.75) {
			return 'hot';
		} else if (scaledDensity >= 0.25) {
			return 'medium';
		} else if (scaledDensity >= 0.1) {
			return 'mild';
		} else {
			return 'good';
		}
	}

	$: console.log(groupings);
</script>

{#each groupings as group}
	<Group {group} selectPage={(payload) => selectPage(payload)} />
{/each}

<style>
	.totalPages {
		font-size: 22px;
		color: #414141;
	}
	.title {
		direction: rtl;
		text-align: right;
		font-size: 28px;
	}

	.report {
		text-align: right;
		padding: 10px 0;
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
	}
</style>
