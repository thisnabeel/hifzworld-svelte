<script>
	import { Peer } from 'peerjs';
	import API from '$lib/api/api';
	import { onDestroy, onMount } from 'svelte';

	let peer = null;
	let localStream = null;
	let remoteStream = null;
	let call = null;
	let eventPeerId = '';
	let localVideoEl;
	let remoteVideoEl;
	let connectionAttempts = 0;
	const MAX_RETRY_ATTEMPTS = 30;

	export let event;
	export let user;

	onMount(async () => {
		try {
			localStream = await getMediaStream();
			if (localStream) {
				localVideoEl.srcObject = localStream;
			}
			await initializeConnection();
		} catch (err) {
			console.error('Error during mount:', err);
		}
	});

	async function checkCurrentParticipants() {
		try {
			// Get current participants count from your API
			const response = await API.get(`/events/${event.id}/participants/`);
			const activeParticipants = response.data.active_count || 0;
			console.log('Active participants:', activeParticipants);

			// If no active participants, become the host
			if (activeParticipants === 0) {
				const newPeerId = await initPeer();
				console.log('No active participants, becoming host with ID:', newPeerId);
				eventPeerId = newPeerId;
				await API.patch(`/events/${event.id}/update_peer_id/`, {
					peer_id: eventPeerId,
					is_host: true
				});
				peer.on('call', handleIncomingCall);
				return true; // Return true if we became host
			}
			return false; // Return false if we didn't become host
		} catch (err) {
			console.error('Error checking participants:', err);
			return false;
		}
	}

	async function initializeConnection() {
		try {
			// First check if we should become host
			const becameHost = await checkCurrentParticipants();

			if (!becameHost) {
				// If we didn't become host, try to connect to existing host
				const peerId = await initPeer();

				if (!event.peer_id) {
					// No existing peer ID, become host
					console.log('No peer ID exists, becoming host:', peerId);
					eventPeerId = peerId;
					await API.patch(`/events/${event.id}/update_peer_id/`, {
						peer_id: eventPeerId,
						is_host: true
					});
					peer.on('call', handleIncomingCall);
				} else {
					// Try to connect to existing host
					console.log('Attempting to connect to host:', event.peer_id);
					eventPeerId = event.peer_id;
					await attemptConnection();
				}
			}

			// Register connection status with backend
			await API.post(`/events/${event.id}/register_participant/`, {
				peer_id: peer.id,
				status: 'connected'
			});

			// Set up heartbeat to maintain active status
			const heartbeatInterval = setInterval(async () => {
				try {
					await API.post(`/events/${event.id}/heartbeat/`, {
						peer_id: peer.id
					});
				} catch (err) {
					console.error('Heartbeat failed:', err);
				}
			}, 30000); // Every 30 seconds

			// Clean up heartbeat on component destroy
			onDestroy(() => {
				clearInterval(heartbeatInterval);
			});
		} catch (err) {
			console.error('Connection initialization error:', err);
			retryConnection();
		}
	}

	async function handlePeerDisconnection() {
		console.log('Peer disconnected, checking if we should become host...');

		try {
			// Mark our disconnection in the backend
			await API.post(`/events/${event.id}/register_participant/`, {
				peer_id: peer.id,
				status: 'disconnected'
			});

			// Wait a short time to let other disconnections register
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Check if we should become the new host
			const becameHost = await checkCurrentParticipants();

			if (becameHost) {
				console.log('Became new host after disconnection');
			} else {
				console.log('Another peer is host, attempting to reconnect...');
				retryConnection();
			}
		} catch (err) {
			console.error('Error handling peer disconnection:', err);
			retryConnection();
		}
	}

	async function initPeer() {
		return new Promise((resolve, reject) => {
			if (!peer) {
				peer = new Peer();
			}

			peer.on('open', (id) => {
				console.log('My Peer ID:', id);
				resolve(id);
			});

			peer.on('error', (err) => {
				console.error('PeerJS Error:', err);
				reject(err);
			});

			peer.on('disconnected', () => {
				console.log('Peer disconnected');
				handlePeerDisconnection();
			});
		});
	}

	async function attemptConnection() {
		if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
			console.error('Max connection attempts reached');
			// Try becoming host after max retries
			await checkCurrentParticipants();
			return;
		}

		try {
			console.log(`Connection attempt ${connectionAttempts + 1} to peer:`, eventPeerId);
			call = peer.call(eventPeerId, localStream);

			call.on('stream', (stream) => {
				console.log('Received remote stream');
				remoteStream = stream;
				remoteVideoEl.srcObject = stream;
				connectionAttempts = 0;
			});

			call.on('error', (err) => {
				console.error('Call error:', err);
				retryConnection();
			});

			call.on('close', () => {
				console.log('Call closed');
				remoteStream = null;
				remoteVideoEl.srcObject = null;
				handlePeerDisconnection();
			});
		} catch (err) {
			console.error('Error during connection attempt:', err);
			retryConnection();
		}
	}

	function retryConnection() {
		connectionAttempts++;
		if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
			console.log(`Retrying connection in 10 seconds... (Attempt ${connectionAttempts})`);
			setTimeout(() => initializeConnection(), 10000);
		} else {
			// After max retries, check if we should become host
			checkCurrentParticipants();
		}
	}

	async function handleIncomingCall(incomingCall) {
		console.log('Received incoming call');
		try {
			incomingCall.answer(localStream);

			incomingCall.on('stream', (stream) => {
				console.log('Received remote stream from incoming call');
				remoteStream = stream;
				remoteVideoEl.srcObject = stream;
			});
		} catch (err) {
			console.error('Error handling incoming call:', err);
		}
	}

	async function getMediaStream() {
		try {
			return await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true
			});
		} catch (err) {
			console.error('Media access error:', err);
			alert('Please allow access to camera and microphone.');
			return null;
		}
	}

	async function endCall() {
		try {
			// Unregister participant
			await API.post(`/events/${event.id}/register_participant/`, {
				peer_id: peer?.id,
				status: 'disconnected'
			});

			if (call) {
				call.close();
				call = null;
			}
			if (localStream) {
				localStream.getTracks().forEach((track) => track.stop());
				localStream = null;
				localVideoEl.srcObject = null;
			}
			if (remoteStream) {
				remoteStream = null;
				remoteVideoEl.srcObject = null;
			}
		} catch (err) {
			console.error('Error ending call:', err);
		}
	}

	onDestroy(async () => {
		await endCall();
		if (peer) {
			peer.disconnect();
			peer.destroy();
		}
	});
</script>

<!-- Rest of the component remains the same -->
<div class="video-chat-container">
	<h1>📹 Video Call</h1>
	<div class="video-wrapper">
		<div class="video-box">
			<h2>📷 You</h2>
			<video bind:this={localVideoEl} autoplay playsinline muted />
		</div>
		<div class="video-box">
			<h2>🎥 Friend</h2>
			<video bind:this={remoteVideoEl} autoplay playsinline />
		</div>
	</div>

	<div class="call-controls">
		<button class="btn btn-danger" on:click={endCall}>End Call</button>
	</div>
</div>

<style>
	.video-chat-container {
		text-align: center;
	}

	.video-wrapper {
		display: flex;
		justify-content: center;
		gap: 20px;
		margin: 20px 0;
	}

	.video-box {
		width: 400px;
		height: 400px;
		background: black;
		border-radius: 10px;
		overflow: hidden;
		position: relative;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 10px;
	}

	.call-controls {
		margin-top: 20px;
	}

	.btn {
		padding: 10px 20px;
		border-radius: 5px;
		border: none;
		cursor: pointer;
		font-size: 16px;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-danger:hover {
		background-color: #bd2130;
	}
</style>
