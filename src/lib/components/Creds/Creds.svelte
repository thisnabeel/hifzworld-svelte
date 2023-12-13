<script>
	import Api from '$lib/api/api';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user';

	let email;
	let password;
	let confirmPassword;

	$: console.log(email);

	$: {
		if ($user) {
			goto(`/`);
		}
	}

	const authenticate = async (verb) => {
		let response;
		if (verb === 'signIn') {
			response = await Api.post('/users/sign_in', {
				email: email,
				password: password
			});
		}

		if (verb === 'signUp') {
			response = await Api.post('/users/sign_up', {
				email: email,
				password: password,
				password_confirmation: confirmPassword
			});
		}
		console.log(response);
		if (response['id']) {
			user.set(response);
			// goto(`/`);
			// if (hidePopUp) {
			// 	hidePopUp();
			// }
			// goto(`/`);
		}
	};

	let view = 'signIn';
</script>

<picture class="logo">
	<img src="/logo.png" alt="harpoonium Logo" />
</picture>

{#if view === 'signIn'}
	<div class="form">
		<img src="/sign-in.png" alt="" class="sign-up-img creds-header-img" />

		<label>Email:</label>
		<input type="text" bind:value={email} />

		<label>Password:</label>
		<input type="password" bind:value={password} />

		<button on:click={() => authenticate('signIn')}>Log In</button>
		<hr />
		<div class="text-center" on:click={() => (view = 'signUp')}>
			<span>Sign Up</span>
		</div>
	</div>
{:else}
	<div class="form">
		<img src="/sign-up.png" alt="" class="sign-up-img creds-header-img" />

		<label>Email:</label>
		<input type="text" bind:value={email} />

		<label>Password:</label>
		<input type="password" bind:value={password} />

		<label>Confirm Password:</label>
		<input type="password" bind:value={confirmPassword} />

		<button on:click={() => authenticate('signUp')}>Sign Up</button>
		<hr />
		<div class="text-center" on:click={() => (view = 'signIn')}>
			<span>Log In</span>
		</div>
	</div>
{/if}

<style>
	.form {
		max-width: 300px;
		margin: 30px auto;
		background: #fff;
		padding: 30px;
		border-radius: 6px;
		border: 9px solid #f6f8ff;
	}

	input {
		width: 100%;
		font-family: GreyCliffCF-Regular;
		color: rgb(49, 49, 49);
		border: solid 1px #ccc;
	}

	button {
		margin-top: 10px;
		background-color: #fffe8b;
		display: block;
		width: 100%;
		height: calc(1.5em + 0.75rem + 2px);
		padding: 0.375rem 0.75rem;
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.5;
		color: #495057;
		background-clip: padding-box;
		border: 1px solid #ced4da;
		border-radius: 0.25rem;
		transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
	}

	.logo img {
		margin: 0 auto;
		margin-top: 30px;
		display: block;
		max-width: 200px;
	}

	img.creds-header-img {
		margin: 10px auto;
		display: block;
		width: 100%;
	}
</style>
