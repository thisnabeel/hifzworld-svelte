<script>
	import API from '$lib/api/api';
	import { onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/user';
	import { socialRoom, socialViewTab } from './social_store';

	let onlineFriends = [];
	let matchmakingRequests = { sent_requests: [], received_requests: [] };
	let websocket = null;
	let connectionStatus = 'disconnected';
	let isAvailable = true;
	let notification = null;

	onMount(() => {
		loadOnlineFriends();
		loadMatchmakingRequests();
		setupWebSocket();

		// Set initial online status
		updateOnlineStatus(true, true);

		// Poll for updates every 30 seconds
		const pollInterval = setInterval(() => {
			loadOnlineFriends();
			loadMatchmakingRequests();
		}, 30000);

		return () => clearInterval(pollInterval);
	});

	onDestroy(() => {
		if (websocket) {
			websocket.close();
		}
		updateOnlineStatus(false, false);
	});

	async function setupWebSocket() {
		try {
			const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
			const baseURL = import.meta.env.PROD
				? import.meta.env.VITE_API_URL
				: import.meta.env.VITE_API_URL;
			const wsEndpoint = `${wsUrl}${baseURL.split('//')[1].split('/')[0]}/ws/matchmaking/${
				$user.id
			}/`;

			websocket = new WebSocket(wsEndpoint);

			websocket.onopen = () => {
				connectionStatus = 'connected';
				console.log('Matchmaking WebSocket connected');

				// Send heartbeat every 20 seconds
				const heartbeatInterval = setInterval(() => {
					if (websocket && websocket.readyState === WebSocket.OPEN) {
						websocket.send(JSON.stringify({ type: 'heartbeat' }));
					} else {
						clearInterval(heartbeatInterval);
					}
				}, 20000);
			};

			websocket.onmessage = (event) => {
				const data = JSON.parse(event.data);

				if (data.type === 'matchmaking_notification') {
					showNotification(data.data);
					loadMatchmakingRequests();
				} else if (data.type === 'friend_status_update') {
					loadOnlineFriends();
				}
			};

			websocket.onclose = () => {
				connectionStatus = 'disconnected';
				console.log('Matchmaking WebSocket disconnected');

				// Attempt to reconnect after 5 seconds
				setTimeout(() => {
					if (connectionStatus === 'disconnected') {
						setupWebSocket();
					}
				}, 5000);
			};

			websocket.onerror = (error) => {
				console.error('WebSocket error:', error);
				connectionStatus = 'error';
			};
		} catch (error) {
			console.error('Failed to setup WebSocket:', error);
			connectionStatus = 'error';
		}
	}

	async function loadOnlineFriends() {
		try {
			const response = await API.get(`/users/${$user.id}/online-friends/`);
			onlineFriends = response || [];
		} catch (error) {
			console.error('Failed to load online friends:', error);
		}
	}

	async function loadMatchmakingRequests() {
		try {
			const response = await API.get(`/users/${$user.id}/matchmaking-requests/`);
			matchmakingRequests = response || { sent_requests: [], received_requests: [] };
		} catch (error) {
			console.error('Failed to load matchmaking requests:', error);
		}
	}

	async function updateOnlineStatus(online, available) {
		try {
			await API.post(`/users/${$user.id}/update-status/`, {
				is_online: online,
				is_available_for_match: available
			});
		} catch (error) {
			console.error('Failed to update online status:', error);
		}
	}

	async function requestMatch(friendId) {
		try {
			const response = await API.post('/matchmaking/request/', {
				requester_id: $user.id,
				target_user_id: friendId
			});

			showNotification({
				type: 'success',
				message: 'Match request sent!'
			});

			loadMatchmakingRequests();
		} catch (error) {
			showNotification({
				type: 'error',
				message: error.message || 'Failed to send match request'
			});
		}
	}

	async function handleMatchRequest(requestId, action) {
		try {
			await API.post(`/matchmaking/request/${requestId}/action/`, {
				action: action
			});

			if (action === 'accept') {
				showNotification({
					type: 'success',
					message: 'Match accepted! Starting session...'
				});

				// Load the created event and enter the room
				loadMatchmakingRequests();
				// The backend should have created an event for the match
				// We'll need to fetch it and enter the room
				setTimeout(() => {
					loadAndEnterMatch(requestId);
				}, 1000);
			} else {
				showNotification({
					type: 'info',
					message: 'Match request declined'
				});
			}

			loadMatchmakingRequests();
		} catch (error) {
			showNotification({
				type: 'error',
				message: error.message || 'Failed to handle match request'
			});
		}
	}

	async function loadAndEnterMatch(requestId) {
		try {
			// Find the accepted request and get the session info
			const request = matchmakingRequests.received_requests.find((r) => r.id === requestId);
			if (request && request.session_id) {
				// The session_id should contain the event ID for the match
				const eventResponse = await API.get(`/events/${request.session_id}/`);
				socialViewTab.set('chatroom');
				socialRoom.set(eventResponse);
			}
		} catch (error) {
			console.error('Failed to load match event:', error);
		}
	}

	function showNotification(data) {
		notification = data;
		setTimeout(() => {
			notification = null;
		}, 3000);
	}

	function toggleAvailability() {
		isAvailable = !isAvailable;
		updateOnlineStatus(true, isAvailable);
	}

	function getStatusColor(online, available) {
		if (!online) return 'text-muted';
		if (available) return 'text-success';
		return 'text-warning';
	}

	function getStatusText(online, available) {
		if (!online) return 'Offline';
		if (available) return 'Available for Match';
		return 'Busy';
	}

	function formatLastSeen(lastSeenStr) {
		if (!lastSeenStr) return 'Unknown';

		const lastSeen = new Date(lastSeenStr);
		const now = new Date();
		const diffMinutes = Math.floor((now - lastSeen) / 60000);

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
		return `${Math.floor(diffMinutes / 1440)}d ago`;
	}
</script>

<div class="container mt-4">
	<h2 class="text-center">⚔️ PVP Matchmaking</h2>

	<!-- Connection Status -->
	<div class="row mb-4">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center">
				<div class="d-flex align-items-center gap-3">
					<span class="badge bg-{connectionStatus === 'connected' ? 'success' : 'danger'}">
						{connectionStatus === 'connected' ? '🟢 Online' : '🔴 Offline'}
					</span>
					<button
						class="btn btn-sm {isAvailable ? 'btn-success' : 'btn-warning'}"
						on:click={toggleAvailability}
					>
						{isAvailable ? '🟢 Available' : '🟡 Busy'}
					</button>
				</div>
				<small class="text-muted">
					{onlineFriends.length} friend{onlineFriends.length !== 1 ? 's' : ''} online
				</small>
			</div>
		</div>
	</div>

	<!-- Notification -->
	{#if notification}
		<div
			class="alert alert-{notification.type === 'success'
				? 'success'
				: notification.type === 'error'
				? 'danger'
				: 'info'} alert-dismissible fade show"
			role="alert"
		>
			{notification.message}
			<button type="button" class="btn-close" on:click={() => (notification = null)} />
		</div>
	{/if}

	<!-- Online Friends Section -->
	<div class="row mb-5">
		<div class="col-12">
			<h4 class="text-center mb-3">🟢 Online Friends</h4>
			{#if onlineFriends.length === 0}
				<div class="text-center text-muted py-4">
					<p>No friends are currently online and available for matching.</p>
					<p class="small">Ask your friends to come online to start a PVP session!</p>
				</div>
			{:else}
				<div class="row">
					{#each onlineFriends as friend}
						<div class="col-md-6 col-lg-4 mb-3">
							<div class="card">
								<div class="card-body">
									<div class="d-flex justify-content-between align-items-start">
										<div>
											<h6 class="card-title mb-1">
												{friend.first_name}
												{friend.last_name}
											</h6>
											<small
												class={getStatusColor(friend.is_online, friend.is_available_for_match)}
											>
												{getStatusText(friend.is_online, friend.is_available_for_match)}
											</small>
										</div>
										<div class="text-end">
											<small class="text-muted d-block">
												{formatLastSeen(friend.last_seen)}
											</small>
										</div>
									</div>
									{#if friend.is_available_for_match}
										<button
											class="btn btn-primary btn-sm mt-2 w-100"
											on:click={() => requestMatch(friend.id)}
										>
											⚔️ Challenge to Match
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Matchmaking Requests -->
	{#if matchmakingRequests.received_requests.length > 0}
		<div class="row mb-4">
			<div class="col-12">
				<h5>📨 Incoming Requests</h5>
				<div class="list-group">
					{#each matchmakingRequests.received_requests.filter((r) => r.status === 'pending') as request}
						<div class="list-group-item d-flex justify-content-between align-items-center">
							<div>
								<strong>{request.requester_name}</strong> wants to match with you
								<br />
								<small class="text-muted">
									{new Date(request.created_at).toLocaleTimeString()}
								</small>
							</div>
							<div class="btn-group">
								<button
									class="btn btn-success btn-sm"
									on:click={() => handleMatchRequest(request.id, 'accept')}
								>
									✅ Accept
								</button>
								<button
									class="btn btn-outline-danger btn-sm"
									on:click={() => handleMatchRequest(request.id, 'decline')}
								>
									❌ Decline
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Sent Requests -->
	{#if matchmakingRequests.sent_requests.length > 0}
		<div class="row">
			<div class="col-12">
				<h5>📤 Sent Requests</h5>
				<div class="list-group">
					{#each matchmakingRequests.sent_requests.filter((r) => r.status === 'pending') as request}
						<div class="list-group-item d-flex justify-content-between align-items-center">
							<div>
								Waiting for <strong>{request.target_user_name}</strong> to respond
								<br />
								<small class="text-muted">
									{new Date(request.created_at).toLocaleTimeString()}
								</small>
							</div>
							<span class="badge bg-warning">Pending</span>
						</div>
					{/each}

					{#each matchmakingRequests.sent_requests.filter((r) => r.status === 'accepted') as request}
						<div class="list-group-item d-flex justify-content-between align-items-center">
							<div>
								<strong>{request.target_user_name}</strong> accepted your challenge!
								<br />
								<small class="text-muted">
									{new Date(request.created_at).toLocaleTimeString()}
								</small>
							</div>
							<button class="btn btn-success btn-sm" on:click={() => loadAndEnterMatch(request.id)}>
								🚀 Enter Match
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.card {
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.btn-primary {
		background: linear-gradient(45deg, #007bff, #0056b3);
		border: none;
	}

	.btn-success {
		background: linear-gradient(45deg, #28a745, #1e7e34);
		border: none;
	}
</style>
