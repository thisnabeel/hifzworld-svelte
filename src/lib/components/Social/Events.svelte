<script>
	import API from '$lib/api/api';
	import { onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/user';
	import { socialRoom, socialViewTab } from './social_store';

	let onlineFriends = [];
	let matchmakingRequests = { sent_requests: [], received_requests: [] };
	let availableRooms = [];
	let websocket = null;
	let connectionStatus = 'disconnected';
	let isAvailable = true;
	let notification = null;

	// Reactive statement to handle user loading
	let initialized = false;
	$: if ($user && $user.id && !initialized) {
		// User is available for the first time, initialize everything
		initialized = true;
		loadOnlineFriends();
		loadMatchmakingRequests();
		loadAvailableRooms();
		setupWebSocket();
		updateOnlineStatus(true, true);
	}

	onMount(() => {
		// Only initialize if user is available
		if ($user && $user.id) {
			loadOnlineFriends();
			loadMatchmakingRequests();
			loadAvailableRooms();
			setupWebSocket();

			// Set initial online status
			updateOnlineStatus(true, true);

			// Poll for updates every 30 seconds
			const pollInterval = setInterval(() => {
				if ($user && $user.id) {
					loadOnlineFriends();
					loadMatchmakingRequests();
				}
			}, 30000);

			return () => clearInterval(pollInterval);
		}
	});

	onDestroy(() => {
		if (websocket) {
			websocket.close();
		}
		updateOnlineStatus(false, false);
	});

	async function setupWebSocket() {
		if (!$user || !$user.id) {
			console.warn('Cannot setup WebSocket: user not available');
			return;
		}

		try {
			const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
			const baseURL = import.meta.env.PROD
				? import.meta.env.VITE_API_URL
				: import.meta.env.VITE_API_URL;

			// Extract hostname from URL more robustly
			let hostname;
			try {
				const url = new URL(baseURL);
				hostname = url.hostname + (url.port ? `:${url.port}` : '');
			} catch (e) {
				// Fallback to old parsing if URL constructor fails
				hostname = baseURL.split('//')[1].split('/')[0];
			}

			const wsEndpoint = `${wsUrl}${hostname}/ws/matchmaking/${$user.id}/`;
			console.log('Attempting WebSocket connection to:', wsEndpoint);

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
				} else if (data.type === 'match_status_update') {
					handleMatchStatusUpdate(data.data);
				} else if (data.type === 'room_notification') {
					handleRoomNotification(data.data);
				}
			};

			websocket.onclose = (event) => {
				connectionStatus = 'disconnected';
				console.log('Matchmaking WebSocket disconnected', {
					code: event.code,
					reason: event.reason,
					wasClean: event.wasClean,
					endpoint: wsEndpoint
				});

				// Attempt to reconnect after 5 seconds
				setTimeout(() => {
					if (connectionStatus === 'disconnected') {
						console.log('Attempting to reconnect WebSocket...');
						setupWebSocket();
					}
				}, 5000);
			};

			websocket.onerror = (error) => {
				console.error('WebSocket error:', {
					error,
					endpoint: wsEndpoint,
					readyState: websocket.readyState
				});
				connectionStatus = 'error';
			};
		} catch (error) {
			console.error('Failed to setup WebSocket:', error);
			connectionStatus = 'error';
		}
	}

	async function loadOnlineFriends() {
		if (!$user || !$user.id) {
			console.warn('Cannot load online friends: user not available');
			return;
		}

		try {
			const response = await API.get(`/users/${$user.id}/online-friends/`);
			onlineFriends = response || [];
		} catch (error) {
			console.error('Failed to load online friends:', error);
		}
	}

	async function loadMatchmakingRequests() {
		if (!$user || !$user.id) {
			console.warn('Cannot load matchmaking requests: user not available');
			return;
		}

		try {
			const response = await API.get(`/users/${$user.id}/matchmaking-requests/`);
			matchmakingRequests = response || { sent_requests: [], received_requests: [] };
		} catch (error) {
			console.error('Failed to load matchmaking requests:', error);
		}
	}

	async function loadAvailableRooms() {
		if (!$user || !$user.id) {
			console.warn('Cannot load rooms: user not available');
			return;
		}

		try {
			const response = await API.get(`/users/${$user.id}/rooms/`);
			availableRooms = response.rooms || [];
		} catch (error) {
			console.error('Failed to load available rooms:', error);
		}
	}

	async function updateOnlineStatus(online, available) {
		if (!$user || !$user.id) {
			console.warn('Cannot update online status: user not available');
			return;
		}

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
		if (!$user || !$user.id) {
			console.warn('Cannot request match: user not available');
			return;
		}

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

				// Load the updated matchmaking requests first
				await loadMatchmakingRequests();

				// Then try to enter the match
				setTimeout(() => {
					loadAndEnterMatch(requestId);
				}, 500);
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
			console.log('Loading match for request ID:', requestId);
			console.log('Available requests:', matchmakingRequests);

			// Find the accepted request in both sent and received requests
			let request = matchmakingRequests.received_requests.find((r) => r.id === requestId);
			if (!request) {
				request = matchmakingRequests.sent_requests.find((r) => r.id === requestId);
			}

			console.log('Found request:', request);

			if (request && request.session_id) {
				console.log('Loading event with ID:', request.session_id);
				// The session_id should contain the event ID for the match
				const eventResponse = await API.get(`/events/${request.session_id}/`);
				console.log('Event loaded:', eventResponse);

				// Update match status to in_progress and notify the other user
				await updateMatchStatus(requestId, 'enter_room');

				socialViewTab.set('chatroom');
				socialRoom.set(eventResponse);
			} else {
				console.error('Request not found or no session_id:', {
					request,
					session_id: request?.session_id,
					requestId,
					allRequests: matchmakingRequests
				});
				showNotification({
					type: 'error',
					message: 'Could not find match details. Please try again.'
				});
			}
		} catch (error) {
			console.error('Failed to load match event:', error);
			showNotification({
				type: 'error',
				message: 'Failed to load match. Please try again.'
			});
		}
	}

	function showNotification(data) {
		notification = data;
		setTimeout(() => {
			notification = null;
		}, 3000);
	}

	function handleMatchStatusUpdate(data) {
		console.log('Match status update received:', data);

		if (data.type === 'user_entered_room') {
			showNotification({
				type: 'info',
				message: `${data.user_name} has entered the match room and is waiting for you!`
			});
		}

		// Refresh the matchmaking requests to update status
		loadMatchmakingRequests();
	}

	async function updateMatchStatus(requestId, action) {
		if (!$user || !$user.id) {
			console.warn('Cannot update match status: user not available');
			return;
		}

		try {
			await API.post(`/matchmaking/request/${requestId}/status/`, {
				action: action,
				user_id: $user.id
			});
			console.log(`Match status updated to: ${action}`);
		} catch (error) {
			console.error('Failed to update match status:', error);
		}
	}

	function handleRoomNotification(data) {
		console.log('Room notification received:', data);

		if (data.type === 'room_created') {
			showNotification({
				type: 'info',
				message: `${data.creator_name} created a room for you to join!`
			});
		} else if (data.type === 'user_joined_room') {
			showNotification({
				type: 'success',
				message: `${data.joiner_name} joined your room!`
			});
		} else if (data.type === 'user_left_room') {
			showNotification({
				type: 'warning',
				message: `${data.leaver_name} left the room`
			});
		}

		// Refresh the available rooms
		loadAvailableRooms();
	}

	async function createRoom(targetUserId = null) {
		if (!$user || !$user.id) {
			console.warn('Cannot create room: user not available');
			return;
		}

		try {
			const roomData = {
				user_id: $user.id,
				title: 'PVP Match'
			};

			if (targetUserId) {
				roomData.target_user_id = targetUserId;
			}

			const response = await API.post('/rooms/create/', roomData);
			console.log('Room created:', response);

			// Refresh available rooms
			await loadAvailableRooms();

			showNotification({
				type: 'success',
				message: 'Room created successfully!'
			});
		} catch (error) {
			console.error('Failed to create room:', error);
			showNotification({
				type: 'error',
				message: 'Failed to create room. Please try again.'
			});
		}
	}

	async function joinRoom(roomId) {
		if (!$user || !$user.id) {
			console.warn('Cannot join room: user not available');
			return;
		}

		try {
			// Use the enter endpoint which handles creating session for room creator
			const response = await API.post(`/rooms/${roomId}/enter/`, {
				user_id: $user.id
			});
			console.log('Entered room:', response);

			// Refresh available rooms
			await loadAvailableRooms();

			// Navigate to the chatroom - if session_id exists now, go to chatroom
			if (response.room.session_id) {
				// Get the actual event data
				const eventResponse = await API.get(`/events/${response.room.session_id}/`);
				console.log('Event loaded for room:', eventResponse);
				socialViewTab.set('chatroom');
				socialRoom.set(eventResponse);
				showNotification({
					type: 'success',
					message: 'Entering room...'
				});
			} else {
				// This should not happen now with the updated backend logic
				console.warn('Room has no session_id after entering');
			}
		} catch (error) {
			console.error('Failed to join room:', error);
			showNotification({
				type: 'error',
				message: 'Failed to join room. Please try again.'
			});
		}
	}

	// Function for direct room entry via URL (can be used from route handlers)
	async function enterRoomDirectly(roomId) {
		if (!$user || !$user.id) {
			console.warn('Cannot enter room: user not available');
			return false;
		}

		try {
			// Use the enter endpoint which handles creating session for room creator
			const response = await API.post(`/rooms/${roomId}/enter/`, {
				user_id: $user.id
			});
			console.log('Entered room directly:', response);

			// Navigate to the chatroom - if session_id exists now, go to chatroom
			if (response.room.session_id) {
				// Get the actual event data
				const eventResponse = await API.get(`/events/${response.room.session_id}/`);
				console.log('Event loaded for room:', eventResponse);
				socialViewTab.set('chatroom');
				socialRoom.set(eventResponse);
				return true;
			} else {
				console.warn('Room has no session_id after entering');
				return false;
			}
		} catch (error) {
			console.error('Failed to enter room:', error);
			return false;
		}
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

{#if $user && $user.id}
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
											<div class="btn-group w-100 mt-2">
												<button
													class="btn btn-primary btn-sm"
													on:click={() => requestMatch(friend.id)}
												>
													⚔️ Challenge
												</button>
												<button
													class="btn btn-success btn-sm"
													on:click={() => createRoom(friend.id)}
												>
													🏠 Create Room
												</button>
											</div>
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

		<!-- Available Rooms -->
		<div class="row mb-4">
			<div class="col-12">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h5>🏠 Available Rooms</h5>
					<button class="btn btn-primary btn-sm" on:click={() => createRoom()}>
						➕ Create Room
					</button>
	</div>

				{#if availableRooms.length > 0}
					<div class="list-group">
						{#each availableRooms as room}
							<div class="list-group-item d-flex justify-content-between align-items-center">
								<div>
									<strong>{room.title}</strong>
									<br />
									<small class="text-muted">
										Room: {room.room_code} |
										{room.user1_name}
										{#if room.user2_name}vs {room.user2_name}{:else}(waiting for opponent){/if}
										<br />
										Status: <span class="badge bg-info">{room.status}</span> |
										{new Date(room.last_activity).toLocaleTimeString()}
										<br />
										URL: /room/{room.id}
									</small>
			</div>
								<div class="btn-group">
									{#if room.can_join}
										{#if room.is_user_in_room}
											<button class="btn btn-primary btn-sm" on:click={() => joinRoom(room.id)}>
												🏠 Enter Room
											</button>
										{:else}
											<button class="btn btn-success btn-sm" on:click={() => joinRoom(room.id)}>
												🚀 Join Room
											</button>
										{/if}
		{:else}
										<button class="btn btn-outline-secondary btn-sm" disabled>
											👥 Full/Unavailable
										</button>
		{/if}
	</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center text-muted py-3">
						No rooms available. Create one to start a PVP match!
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="container mt-4">
		<div class="text-center">
			<h2>⚔️ PVP Matchmaking</h2>
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
			<p class="mt-2">Loading user data...</p>
	</div>
</div>
{/if}

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
