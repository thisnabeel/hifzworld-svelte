<script>
	import { page } from '$app/stores';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { user } from '$lib/stores/user';
	import HeaderCorners from '$lib/components/HeaderCorners/HeaderCorners.svelte';
	import { goto } from '$app/navigation';
	import { showStats, showVerseRefSearcher } from '$lib/stores/main';
</script>

{#if $user}
	<HeaderCorners />
{/if}
<header>
	<div class="corner">
		<!-- <a href="https://kit.svelte.dev">
			<img src={logo} alt="SvelteKit" />
		</a> -->
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul
			class:home={$page.url.pathname === '/' || $page.url.pathname === ''}
			class:no-home={$page.url.pathname !== '/'}
		>
			<!-- <li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Home</a>
			</li> -->
			{#if $page.url.pathname !== '/'}
				<a href="#" on:click={() => goto('/')}><i class="fa fa-home" /></a>
			{/if}
			{#if $user}
				<li aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>
					<a on:click={() => goto('/about')} href="#"><i class="fa fa-question-circle" /></a>
				</li>

				<li aria-current={$page.url.pathname === '/settings' ? 'page' : undefined}>
					<a on:click={() => goto('/settings')} href="#"><i class="fa fa-cog" /></a>
				</li>

				<li>
					<a on:click={() => showVerseRefSearcher.set(true)} href="#"><i class="fa fa-search" /></a>
				</li>

				<li>
					<a on:click={() => goto('/friends')} href="#"><i class="fa fa-users" /></a>
				</li>

				{#if $user}
					<!-- <li>
						<a href="#" on:click={() => user.set(null)}>
							<i class="fa fa-sign-out" />
						</a>
					</li> -->
				{/if}
			{/if}
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner">
		<!-- <a href="https://github.com/sveltejs/kit">
			<img src={github} alt="GitHub" />
		</a> -->
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	.corner {
		width: 3em;
		height: 3em;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	svg {
		width: 2em;
		height: 3em;
		display: block;
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}

	.no-home .fa {
		font-size: 18px;
		margin-top: 12px;
		color: #bc9290;
	}
	.home .fa {
		font-size: 24px;
		margin-top: 10px;
		color: #bc9290;
	}
</style>
