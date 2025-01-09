<script>
	import { closeModal } from 'svelte-modals';
	import { onMount, createEventDispatcher } from 'svelte';
	import { onBeforeClose } from 'svelte-modals';
	import fetchPageByVerse from '$lib/functions/fetchPageByVerse';

	export let mission;

	onMount(async function () {
		document.body.style['overflow-y'] = 'hidden';
	});

	onBeforeClose(() => {
		document.body.style['overflow-y'] = 'initial';
	});

	const handleOutsideClick = () => {
		// closeModal()
	};
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div role="dialog" class="modal-backdrop" on:click|stopPropagation>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="modal-container">
		<div class="modal-content">
			<br />
			<h1 class="question">{mission.question}</h1>

			<div>
				<div class="btn close" on:click={closeModal}><i class="fa fa-times" /></div>
			</div>
			<div class="btn travel" on:click={() => fetchPageByVerse(mission.verse_ref)}>
				<i class="fa fa-plane" />
			</div>

			<div class="flex">
				<div>
					<div class="btn btn-block btn-success" on:click={() => {}}>Confident</div>
				</div>
				<div>
					<div class="btn btn-block btn-danger" on:click={() => {}}>Stuttering</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.question {
		padding: 1em;
	}
	.close {
		position: absolute;
		top: 4px;
		right: 4px;
	}

	.travel {
		position: absolute;
		top: 4px;
		left: 4px;
	}
	.btn-block {
		display: block;
	}
	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1;
		padding: 10px;
	}
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-container {
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
		animation: slideIn 0.3s ease-out;
		overflow: hidden;
	}

	.modal-content {
		padding: 24px;
		overflow-y: auto;
		max-height: calc(90vh - 48px);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* Styling for the header */
	h1 {
		margin: 0 0 16px 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	/* Add smooth scrolling for modal content */
	.modal-content {
		scrollbar-width: thin;
		scrollbar-color: #cbd5e0 #f7fafc;
	}

	.modal-content::-webkit-scrollbar {
		width: 6px;
	}

	.modal-content::-webkit-scrollbar-track {
		background: #f7fafc;
	}

	.modal-content::-webkit-scrollbar-thumb {
		background-color: #cbd5e0;
		border-radius: 3px;
	}
</style>
