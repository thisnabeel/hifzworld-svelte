<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';

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
</script>

<div class="wrapper">
	<picture class="logo">
		<img src="/logo.png" alt="harpoonium Logo" />
	</picture>

	<h1>Salaams,</h1>
	<h3>Welcome to Hifz.World</h3>

	<p>We made this platform so that Huffaz could easily</p>

	<ul>
		<li>Track the Health of their Hifz</li>
		<li>
			Mark mistakes on their mushafs
			<!-- <div
				on:click={() => alert('Demo clicked')}
				style="background: lightblue; display:inline-block; padding: 6px;"
			>
				Click to see Demo
			</div> -->
		</li>
		<li>Test each other</li>
	</ul>

	<div class="flex">
		<div class="flex-50">
			<div class="btn btn-block btn-warning" on:click={() => goto('/users/sign_in')}>Sign Up</div>
		</div>
		<div class="flex-50">
			<div class="btn btn-block btn-primary" on:click={() => goto('/users/sign_in')}>Sign In</div>
		</div>
	</div>
	<br /><br />
	<h3>Wasalams</h3>
	<h3>- <span on:click={() => goto('/users/sign_in')}>Nabeel</span> from Fremont, CA</h3>
</div>

<style>
	.wrapper {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}

	.logo img {
		margin-top: 30px;
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
</style>
