<script>
	import { closeModal } from 'svelte-modals';
	import OutClick from 'svelte-outclick';
	import { onMount, createEventDispatcher } from 'svelte';
	import { onBeforeClose } from 'svelte-modals';

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
<div role="dialog" class="modal" on:click|stopPropagation>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="barrier" on:click|stopPropagation>
		<OutClick on:outclick={handleOutsideClick}>
			<div class="contents">
				<div id="script">
					<h1>Hi</h1>
				</div>
				<button on:click={closeModal} class="closeModal btn btn-outline-success">
					<i class="fa fa-sign-out" />
				</button>
			</div>
		</OutClick>
	</div>
</div>

<style>
</style>
