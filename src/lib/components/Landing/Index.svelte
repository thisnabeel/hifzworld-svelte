<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import Carousel from 'svelte-carousel';
	import { browser } from '$app/environment';

	let carousel; // for calling methods of the carousel instance

	const handleNextClick = () => {
		carousel.goToNext();
	};

	let email = '';

	const submitForm = async () => {
		// Add your form submission logic here
		console.log('Email submitted:', email);
		const res = await API.post('/leads', {
			email: email
		});
		console.log({ res });
		alert('Thanks for Subscribing!');
		email = '';
	};

	let gifs = [
		{
			url: '/gifs/hw-mark-mistake.gif',
			title: 'Mark Your Mistakes'
		},
		{
			url: '/gifs/hw-invert-mistakes.gif',
			title: 'Hone in on your Mistakes'
		},
		{
			url: '/gifs/hw-chapter-selector.gif',
			title: 'Navigate Your Mushaf'
		}
		// {
		// 	url: '',
		// 	title: ''
		// },
		// {
		// 	url: '',
		// 	title: ''
		// },
		// {
		// 	url: '',
		// 	title: ''
		// }
	];
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<div class="wrapper">
	<div class="mains">
		<div class="left-main">
			<picture class="logo">
				<img
					src="/pic-main.jpg"
					style="border-radius:24px; margin-bottom: 24px"
					alt="harpoonium Logo"
				/>
			</picture>

			<h1>اَلسَّلَامُ عَلَيْكُمْ</h1>
			<h3>Welcome to Hifz.World</h3>
		</div>

		<div class="right-main">
			<div class="gifs">
				<p>An App by a Hafiz, for a Hafiz,<br /> so you can...</p>
				{#if browser}
					<Carousel bind:this={carousel} autoplay autoplayDuration={5000} autoplayProgressVisible>
						{#each gifs as gif}
							<div class="gif">
								<h2>{gif.title}</h2>

								<img src={gif.url} alt="" />
							</div>
						{/each}
					</Carousel>
				{/if}
			</div>
		</div>
	</div>

	<div class="flex">
		<div class="flex-50">
			<div class="btn btn-block btn-warning" on:click={() => goto('/users/sign_in')}>Sign Up</div>
		</div>
		<div class="flex-50">
			<div class="btn btn-block btn-primary" on:click={() => goto('/users/sign_in')}>Sign In</div>
		</div>
	</div>
	<br /><br />
	<h3>وعليكم السلام</h3>
	<h3>- <span on:click={() => goto('/users/sign_in')}>Nabeel</span> from Fremont, CA</h3>
</div>

<style>
	.wrapper {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}

	.logo img {
		/* margin-top: 30px; */
		max-width: 200px;
	}

	.btn {
		cursor: pointer;
		padding: 10px 20px;
		border-radius: 5px;
		margin-top: 10px;
	}

	.btn-outline-info {
		border: 1px solid #17a2b8;
		color: #17a2b8;
	}

	.btn-outline-primary {
		border: 1px solid #007bff;
		color: #007bff;
	}

	ul {
		text-align: left;
	}
	input {
		padding: 10px;
		margin-top: 10px;
		width: 100%;
		box-sizing: border-box;
	}

	.gif img {
		max-width: 150px;
	}

	.gifs {
		max-width: 300px;
	}

	.mains {
		display: flex;
	}

	.mains > div {
		flex: 1 1 50%;
	}

	@media (max-device-width: 667px) and (-webkit-min-device-pixel-ratio: 2) {
		.mains {
			display: block;
		}
		.gif img {
			max-width: 100%;
		}

		.gifs {
			max-width: 80vw;
		}

		.btn {
			font-size: 34px;
		}
	}
</style>
