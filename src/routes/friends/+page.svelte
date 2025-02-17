<script>
	import Permissions from '$lib/components/Social/Permissions.svelte';
	import Events from '$lib/components/Social/Events.svelte';
	import Chatroom from '$lib/components/Social/Room.svelte';
	import { socialViewTab, socialRoom } from '$lib/components/Social/social_store';
</script>

<div class="container">
	<!-- Tabs Navigation -->
	<div class="tabs">
		<button
			class={$socialViewTab === 'events' ? 'active' : ''}
			on:click={() => socialViewTab.set('events')}
		>
			<i class="fa fa-calendar" /> Events</button
		>
		<button
			class:hidden={$socialViewTab !== 'chatroom'}
			class={$socialViewTab === 'chatroom' ? 'active' : ''}
			on:click={() => socialViewTab.set('chatroom')}><i class="fa fa-video" /> Room</button
		>
		<button
			class={$socialViewTab === 'permissions' ? 'active' : ''}
			on:click={() => socialViewTab.set('permissions')}
		>
			<i class="fa fa-cog" /> Permissions</button
		>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if $socialViewTab === 'permissions'}
			<Permissions />
		{/if}
		{#if $socialViewTab === 'events'}
			<Events />
		{/if}
		{#if $socialViewTab === 'chatroom' && $socialRoom}
			<Chatroom />
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: auto;
	}

	.tabs {
		display: flex;
		gap: 10px;
		background: #f4f4f4;
		padding: 10px;
		border-radius: 8px;
		justify-content: center;
	}

	.tabs button {
		padding: 10px 15px;
		border: none;
		cursor: pointer;
		background: #ddd;
		border-radius: 5px;
		font-weight: bold;
		transition: background 0.3s;
	}

	.tabs button.active {
		background: #007bff;
		color: white;
	}

	.tabs button:hover {
		background: #bbb;
	}

	.tab-content {
		margin-top: 20px;
		padding: 15px;
		background: #fff;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
	}
</style>
