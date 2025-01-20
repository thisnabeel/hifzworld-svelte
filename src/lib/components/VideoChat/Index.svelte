<script>
	let localVideo;
	let remoteVideo;
	let localStream;
	let peerConnection;
	let ws;
	let remoteDescriptionSet = false;
	let iceCandidateQueue = [];

	const config = {
		iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	};

	function setupWebSocket() {
		if (ws && ws.readyState === WebSocket.OPEN) {
			console.log('WebSocket is already open');
			return;
		}

		ws = new WebSocket('ws://localhost:8000/ws/video-chat/');

		ws.onopen = () => {
			console.log('WebSocket connected');
		};

		ws.onmessage = async (event) => {
			const data = JSON.parse(event.data);

			if (data.offer) {
				await handleOffer(data.offer);
			} else if (data.answer) {
				await handleAnswer(data.answer);
			} else if (data.candidate) {
				if (remoteDescriptionSet) {
					peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((error) => {
						console.error('Error adding ICE candidate:', error);
					});
				} else {
					console.warn('Remote description not set yet. Queuing ICE candidate.');
					iceCandidateQueue.push(data.candidate);
				}
			}
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		ws.onclose = () => {
			console.warn('WebSocket closed. Reconnecting...');
			setTimeout(setupWebSocket, 3000);
		};
	}

	function setupPeerConnection() {
		if (!peerConnection) {
			peerConnection = new RTCPeerConnection(config);

			peerConnection.onicecandidate = (event) => {
				if (event.candidate && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ candidate: event.candidate }));
				}
			};

			peerConnection.ontrack = (event) => {
				remoteVideo.srcObject = event.streams[0];
			};
		}
	}

	async function startLocalVideo() {
		try {
			localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			localVideo.srcObject = localStream;
		} catch (error) {
			console.error('Error accessing camera:', error);
		}
	}

	async function startCall() {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.error('WebSocket is not open. Cannot start call.');
			return;
		}

		setupPeerConnection();

		localStream.getTracks().forEach((track) => {
			peerConnection.addTrack(track, localStream);
		});

		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);

		ws.send(JSON.stringify({ offer }));
	}

	async function handleOffer(offer) {
		setupPeerConnection();

		if (peerConnection.signalingState !== 'stable') {
			console.error('Signaling state is not stable, ignoring offer');
			return;
		}

		await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
		remoteDescriptionSet = true;

		// Process any queued ICE candidates
		iceCandidateQueue.forEach((candidate) => {
			peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) => {
				console.error('Error adding ICE candidate:', error);
			});
		});
		iceCandidateQueue = [];

		const answer = await peerConnection.createAnswer();
		await peerConnection.setLocalDescription(answer);

		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ answer }));
		}
	}

	async function handleAnswer(answer) {
		if (peerConnection.signalingState !== 'have-local-offer') {
			console.error('Signaling state is incorrect, ignoring answer');
			return;
		}

		await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
		remoteDescriptionSet = true;

		// Process queued ICE candidates after setting remote description
		iceCandidateQueue.forEach((candidate) => {
			peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) => {
				console.error('Error adding ICE candidate:', error);
			});
		});
		iceCandidateQueue = [];
	}

	function endCall() {
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}
		localVideo.srcObject = null;
		remoteVideo.srcObject = null;
		remoteDescriptionSet = false;
		iceCandidateQueue = [];
	}

	// Initialize WebSocket connection when component is loaded
	setupWebSocket();
</script>

<div class="video-container">
	<video bind:this={localVideo} autoplay playsinline />
	<video bind:this={remoteVideo} autoplay playsinline />
</div>

<div class="controls">
	<button on:click={startLocalVideo}>Start Camera</button>
	<button on:click={startCall}>Start Call</button>
	<button on:click={endCall}>End Call</button>
</div>

<style>
	video {
		width: 45%;
		border: 2px solid #ccc;
		margin: 5px;
	}
	.video-container {
		display: flex;
		justify-content: center;
		gap: 10px;
	}
	button {
		margin-top: 10px;
		padding: 10px 20px;
		cursor: pointer;
	}
</style>
