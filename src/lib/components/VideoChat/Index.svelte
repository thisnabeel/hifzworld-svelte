<script>
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

	const config = {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:stun1.l.google.com:19302' }
		],
		sdpSemantics: 'unified-plan'
	};

	function setupWebSocket() {
		if (ws?.readyState === WebSocket.OPEN) return;

		ws = new WebSocket('ws://localhost:8000/ws/video-chat/');

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
				await peerConnection.setLocalDescription();
				ws.send(JSON.stringify({ offer: peerConnection.localDescription }));
			} catch (err) {
				console.error(err);
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
		try {
			if (localStream) {
				localStream.getTracks().forEach((track) => track.stop());
			}

			localStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true
			});

			if (localVideo) {
				localVideo.srcObject = localStream;
			}
		} catch (error) {
			console.error('Error accessing media devices:', error);
			throw error;
		}
	}

	async function startCall() {
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
	}

	async function handleOffer(offer) {
		const polite = !isInitiator;
		const offerCollision = makingOffer || peerConnection?.signalingState !== 'stable';

		ignoreOffer = !polite && offerCollision;
		if (ignoreOffer) {
			return;
		}

		if (!peerConnection) {
			await setupPeerConnection();
		}

		if (!localStream) {
			await startLocalVideo();
			localStream.getTracks().forEach((track) => {
				peerConnection.addTrack(track, localStream);
			});
		}

		try {
			await peerConnection.setRemoteDescription(offer);
			await peerConnection.setLocalDescription();
			ws.send(JSON.stringify({ answer: peerConnection.localDescription }));
		} catch (error) {
			console.error('Error handling offer:', error);
		}
	}

	async function handleAnswer(answer) {
		try {
			if (!peerConnection) return;
			await peerConnection.setRemoteDescription(answer);
		} catch (error) {
			console.error('Error handling answer:', error);
		}
	}

	async function handleIceCandidate(candidate) {
		try {
			if (!peerConnection) return;
			await peerConnection.addIceCandidate(candidate);
		} catch (error) {
			if (!ignoreOffer) {
				console.error('Error handling ICE candidate:', error);
			}
		}
	}

	function endCall() {
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
		setupWebSocket();
	});

	onDestroy(() => {
		endCall();
		if (ws) {
			ws.close();
		}
	});
</script>

<div class="video-container">
	<video bind:this={localVideo} autoplay playsinline muted />
	<video bind:this={remoteVideo} autoplay playsinline />
</div>

<div class="controls">
	<button on:click={startLocalVideo} disabled={connectionState !== 'connected'}>
		Start Camera
	</button>
	<button on:click={startCall} disabled={!localStream || connectionState !== 'connected'}>
		Start Call
	</button>
	<button on:click={endCall} disabled={!peerConnection}> End Call </button>
</div>

<style>
	.video-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	video {
		width: 45%;
		max-width: 600px;
		border: 2px solid #ccc;
		border-radius: 4px;
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
		transition: background-color 0.2s;
	}

	button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	button:hover:not(:disabled) {
		background-color: #45a049;
	}
</style>
