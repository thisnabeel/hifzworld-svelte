<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user';
	import { socialViewTab, socialRoom } from '$lib/components/Social/social_store';
	import API from '$lib/api/api';

	let roomId = $page.params.id;
	let loading = true;
	let error = null;
	let room = null;

	onMount(async () => {
		if (!$user || !$user.id) {
			// Redirect to login if user is not authenticated
			goto('/users/sign_in');
			return;
		}

		try {
			// Enter the room directly
			const response = await API.post(`/rooms/${roomId}/enter/`, {
				user_id: $user.id
			});

			room = response.room;

			// Navigate to chatroom if session exists
			if (response.room.session_id) {
				const eventResponse = await API.get(`/events/${response.room.session_id}/`);
				socialRoom.set(eventResponse);
				socialViewTab.set('chatroom');

				// Redirect to friends page with chatroom active
				goto('/friends');
			} else {
				error = 'Room is not ready yet. Please wait for another player to join.';
			}
		} catch (err) {
			console.error('Failed to enter room:', err);
			error = err.response?.data?.error || 'Failed to enter room. Please try again.';
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mt-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card">
				<div class="card-body text-center">
					{#if loading}
						<div class="d-flex justify-content-center">
							<div class="spinner-border text-primary" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
						</div>
						<p class="mt-3">Entering room...</p>
					{:else if error}
						<div class="alert alert-danger" role="alert">
							<h4 class="alert-heading">Cannot Enter Room</h4>
							<p>{error}</p>
							<hr />
							<p class="mb-0">
								<a href="/friends" class="btn btn-primary">Go Back to Friends</a>
							</p>
						</div>
					{:else if room}
						<div class="alert alert-success" role="alert">
							<h4 class="alert-heading">Room Found</h4>
							<p>Room: {room.room_code}</p>
							<p>Redirecting to chatroom...</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
