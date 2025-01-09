<script>
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user';
</script>

<div class="wrapper">
	<h1>Settings:</h1>

	<table class="table">
		<tr />
		<tr>
			<td>Timezone:</td>
			<td
				><select name="" id="" class="form-control">
					<option value="">PST</option>
				</select>
			</td>
		</tr>
		<tr>
			<td>
				<div
					class="btn btn-block btn-outline-danger"
					on:click={() => {
						user.set(null);
						goto('/');
					}}
				>
					Sign Out
				</div>
			</td>
		</tr>
	</table>
</div>

<style>
	.wrapper {
		max-width: 500px;
		/* margin: 0 auto; */
		display: block;
	}
</style>
