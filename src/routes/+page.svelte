<script>
	import MushafPage from '$lib/components/MushafPage/MushafPage.svelte';
	import { user } from '$lib/stores/user';
	import Landing from '$lib/components/Landing/Index.svelte';
</script>

{#if !$user}
	<!-- <Creds /> -->
	<Landing />
{:else}
	<!-- <h1>Hello</h1> -->
	<MushafPage />
{/if}
