<script>
	import { user } from '$lib/stores/user';
	import { onMount, onDestroy } from 'svelte';

	let localVideo;
	let remoteVideo;
	let localStream;
	let peerConnection;
	let ws;
	let isInitiator = false;
	let connectionState = 'disconnected';
	let pendingCandidates = [];
	let makingOffer = false;
	let ignoreOffer = false;
	let mediaError = null;
	let isSafari = false;

	// Reactive status for UI feedback
	$: canStartCamera = connectionState === 'connected' && !mediaError;
	$: canStartCall = localStream && connectionState === 'connected';
	$: canEndCall = !!peerConnection;
	$: statusMessage = mediaError
		? `Error: ${mediaError.message}`
		: getStatusMessage(connectionState);

	const config = {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:stun1.l.google.com:19302' }
		]
	};

	function getStatusMessage(state) {
		switch (state) {
			case 'connected':
				return 'Connected to server';
			case 'disconnected':
				return 'Disconnected from server';
			case 'error':
				return 'Connection error';
			default:
				return 'Initializing...';
		}
	}

	function setupWebSocket() {
		if (ws?.readyState === WebSocket.OPEN) return;

		const baseURL =
			process.env.NODE_ENV === 'production' ? process.env.API_URL : import.meta.env.VITE_API_URL;
		const ws_url = `ws://${baseURL.split('//')[1].split('/')[0]}/ws/video-chat/`;
		ws = new WebSocket(ws_url);

		ws.onopen = () => {
			console.log('WebSocket connected');
			connectionState = 'connected';
		};

		ws.onmessage = async (event) => {
			const data = JSON.parse(event.data);
			try {
				if (data.offer) {
					await handleOffer(data.offer);
				} else if (data.answer) {
					await handleAnswer(data.answer);
				} else if (data.candidate && peerConnection) {
					await handleIceCandidate(data.candidate);
				}
			} catch (error) {
				console.error('Error handling WebSocket message:', error);
			}
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
			connectionState = 'error';
		};

		ws.onclose = () => {
			console.warn('WebSocket closed');
			connectionState = 'disconnected';
			setTimeout(setupWebSocket, 3000);
		};
	}

	async function setupPeerConnection() {
		if (peerConnection) {
			console.log('Cleaning up existing peer connection');
			peerConnection.close();
		}

		peerConnection = new RTCPeerConnection(config);
		console.log('Created new peer connection');

		// Handle negotiation needed
		peerConnection.onnegotiationneeded = async () => {
			try {
				makingOffer = true;
				// Create offer with specific options for Safari compatibility
				const offer = await peerConnection.createOffer({
					offerToReceiveAudio: true,
					offerToReceiveVideo: true
				});
				await peerConnection.setLocalDescription(offer);
				ws.send(JSON.stringify({ offer: peerConnection.localDescription }));
			} catch (err) {
				console.error(err);
				mediaError = err;
			} finally {
				makingOffer = false;
			}
		};

		// Handle ICE candidates
		peerConnection.onicecandidate = ({ candidate }) => {
			if (candidate && ws?.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ candidate }));
			}
		};

		// Handle ICE connection state
		peerConnection.oniceconnectionstatechange = () => {
			console.log('ICE connection state:', peerConnection.iceConnectionState);
			if (peerConnection.iceConnectionState === 'failed') {
				peerConnection.restartIce();
			}
		};

		// Handle remote tracks
		peerConnection.ontrack = (event) => {
			if (remoteVideo && event.streams[0]) {
				remoteVideo.srcObject = event.streams[0];
			}
		};

		return peerConnection;
	}

	async function startLocalVideo() {
		mediaError = null;
		try {
			if (localStream) {
				localStream.getTracks().forEach((track) => track.stop());
			}

			// Check if mediaDevices is available
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('Media devices not available in this browser');
			}

			// Basic constraints that work across browsers
			const constraints = {
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: true
			};

			// Request media access
			localStream = await navigator.mediaDevices.getUserMedia(constraints);

			// Only set the video source if we have both the element and the stream
			if (localVideo && localStream) {
				localVideo.srcObject = localStream;

				// For Safari: explicitly check readyState
				if (localVideo.readyState >= 2) {
					// HAVE_CURRENT_DATA or higher
					await localVideo.play();
				} else {
					localVideo.onloadeddata = async () => {
						try {
							await localVideo.play();
						} catch (e) {
							console.log('Playback delayed:', e);
						}
					};
				}
			}
		} catch (error) {
			console.error('Error accessing media devices:', error);
			mediaError = error;
		}
	}

	async function startCall() {
		mediaError = null;
		try {
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				throw new Error('WebSocket not connected');
			}

			if (!localStream) {
				await startLocalVideo();
			}

			isInitiator = true;
			await setupPeerConnection();

			// Add tracks to the peer connection
			localStream.getTracks().forEach((track) => {
				peerConnection.addTrack(track, localStream);
			});
		} catch (error) {
			console.error('Error starting call:', error);
			mediaError = error;
		}
	}

	async function handleOffer(offer) {
		const polite = !isInitiator;
		const offerCollision = makingOffer || peerConnection?.signalingState !== 'stable';

		ignoreOffer = !polite && offerCollision;
		if (ignoreOffer) {
			return;
		}

		try {
			if (!peerConnection) {
				await setupPeerConnection();
			}

			if (!localStream) {
				await startLocalVideo();
				localStream.getTracks().forEach((track) => {
					peerConnection.addTrack(track, localStream);
				});
			}

			await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
			const answer = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answer);
			ws.send(JSON.stringify({ answer: peerConnection.localDescription }));
		} catch (error) {
			console.error('Error handling offer:', error);
			mediaError = error;
		}
	}

	async function handleAnswer(answer) {
		try {
			if (!peerConnection) return;
			await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
		} catch (error) {
			console.error('Error handling answer:', error);
			mediaError = error;
		}
	}

	async function handleIceCandidate(candidate) {
		try {
			if (!peerConnection) return;
			await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
		} catch (error) {
			if (!ignoreOffer) {
				console.error('Error handling ICE candidate:', error);
				mediaError = error;
			}
		}
	}

	function endCall() {
		mediaError = null;
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			localStream = null;
		}

		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		if (localVideo) {
			localVideo.srcObject = null;
		}

		if (remoteVideo) {
			remoteVideo.srcObject = null;
		}

		pendingCandidates = [];
		isInitiator = false;
		makingOffer = false;
		ignoreOffer = false;
	}

	onMount(() => {
		// Detect Safari
		isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
		setupWebSocket();
	});

	onDestroy(() => {
		endCall();
		if (ws) {
			ws.close();
		}
	});
</script>

{#if $user}
	<div class="container">
		<div class="status-message" class:error={!!mediaError}>
			{statusMessage}
		</div>

		<div class="video-container">
			<div class="video-wrapper">
				<video bind:this={localVideo} autoplay playsinline muted />
				<div class="video-label">{$user.first_name} {$user.last_name}</div>
			</div>
			<div class="video-wrapper">
				<video bind:this={remoteVideo} autoplay playsinline />
				<div class="video-label">Remote Video</div>
			</div>
		</div>

		<div class="controls">
			<button on:click={startLocalVideo} disabled={!canStartCamera} class:error={!!mediaError}>
				Start Camera
			</button>
			<button on:click={startCall} disabled={!canStartCall}> Start Call </button>
			<button on:click={endCall} disabled={!canEndCall}> End Call </button>
		</div>
	</div>
{/if}

<style>
	.container {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.status-message {
		text-align: center;
		padding: 0.5rem;
		margin-bottom: 1rem;
		background-color: #e8f5e9;
		border-radius: 4px;
	}

	.status-message.error {
		background-color: #ffebee;
		color: #c62828;
	}

	.video-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.video-wrapper {
		position: relative;
		width: 45%;
		max-width: 600px;
	}

	video {
		width: 100%;
		border: 2px solid #ccc;
		border-radius: 4px;
		background-color: #f5f5f5;
	}

	.video-label {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #4caf50;
		color: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
		opacity: 0.7;
	}

	button:hover:not(:disabled) {
		background-color: #45a049;
		transform: translateY(-1px);
	}

	button.error {
		background-color: #f44336;
	}

	button.error:hover:not(:disabled) {
		background-color: #d32f2f;
	}

	@media (max-width: 768px) {
		.video-wrapper {
			width: 100%;
		}
	}
</style>
