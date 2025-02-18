<script>
	import { onDestroy, onMount } from 'svelte';

	let localStream;
	let remoteStream;
	let peerConnection;
	let socket;
	let pendingCandidates = [];
	let hasInitiatedOffer = false;
	const baseURL =
		process.env.NODE_ENV === 'production' ? process.env.API_URL : import.meta.env.VITE_API_URL;

	const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

	export let event; // `event.id` is the unique room ID
	const signalingServer = `${wsUrl}${baseURL.split('//')[1].split('/')[0]}/ws/signaling/${
		event.id
	}/`;

	const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

	function startWebRTC() {
		peerConnection = new RTCPeerConnection(iceServers);

		peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				sendSignal({ type: 'candidate', candidate: event.candidate });
			}
		};

		peerConnection.ontrack = (event) => {
			remoteStream.srcObject = event.streams[0];
		};

		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				localStream.srcObject = stream;
				stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

				// ✅ Only one user creates an offer
				if (!hasInitiatedOffer) {
					console.log('📤 Creating WebRTC offer...');
					hasInitiatedOffer = true; // Prevent multiple offers
					return peerConnection.createOffer();
				}
			})
			.then((offer) => {
				if (offer) {
					return peerConnection.setLocalDescription(offer);
				}
			})
			.then(() => {
				if (peerConnection.localDescription) {
					sendSignal({ type: 'offer', offer: peerConnection.localDescription });
					console.log('📤 Offer sent');
				}
			})
			.catch((error) =>
				console.error('❌ Error accessing media devices or creating an offer:', error)
			);
	}

	function sendSignal(data) {
		console.log('📤 Sending WebSocket message:', data);
		socket.send(JSON.stringify(data));
	}

	function handleSignalingMessage(message) {
		if (!peerConnection) return;

		console.log('📩 Received WebRTC signal:', message);

		switch (message.type) {
			case 'offer':
				if (peerConnection.signalingState !== 'stable') {
					console.warn(
						'⚠️ Ignoring new offer while in unstable state:',
						peerConnection.signalingState
					);
					return;
				}

				console.log('📩 Processing WebRTC offer...');
				peerConnection
					.setRemoteDescription(new RTCSessionDescription(message.offer))
					.then(() => {
						console.log('✅ Remote description set. Processing answer...');
						return peerConnection.createAnswer();
					})
					.then((answer) => {
						return peerConnection.setLocalDescription(answer);
					})
					.then(() => {
						sendSignal({ type: 'answer', answer: peerConnection.localDescription });
						console.log('📤 Answer sent');
					})
					.catch((error) => console.error('❌ Error handling offer:', error));
				break;

			case 'answer':
				if (peerConnection.signalingState !== 'have-local-offer') {
					console.warn(
						'⚠️ Ignoring answer while not waiting for one:',
						peerConnection.signalingState
					);
					return;
				}

				console.log('📩 Processing WebRTC answer...');
				peerConnection
					.setRemoteDescription(new RTCSessionDescription(message.answer))
					.then(() => {
						console.log('✅ Remote answer set. Processing stored ICE candidates...');
						pendingCandidates.forEach((candidate) =>
							peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
						);
						pendingCandidates = [];
					})
					.catch((error) => console.error('❌ Error handling answer:', error));
				break;

			case 'candidate':
				if (!peerConnection.remoteDescription || peerConnection.remoteDescription.type === null) {
					console.warn(
						'⚠️ ICE candidate received before remote description was set. Storing for later.'
					);
					pendingCandidates.push(message.candidate);
				} else {
					peerConnection
						.addIceCandidate(new RTCIceCandidate(message.candidate))
						.catch((error) => console.error('❌ Error adding ICE candidate:', error));
				}
				break;
		}
	}

	onMount(() => {
		socket = new WebSocket(signalingServer);

		socket.onopen = () => {
			console.log('✅ WebSocket connected to:', signalingServer);
			startWebRTC();
		};

		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			handleSignalingMessage(message);
		};

		socket.onerror = (error) => console.error('❌ WebSocket error:', error);
		socket.onclose = () => console.log('❌ WebSocket closed.');
	});

	onDestroy(() => {
		if (socket) socket.close();
		if (peerConnection) peerConnection.close();
	});
</script>

<div>
	<h2>Video Chat</h2>
	<video bind:this={localStream} autoplay playsinline muted />
	<video bind:this={remoteStream} autoplay playsinline />
</div>

<style>
	video {
		width: 100%;
		max-height: 400px;
		border-radius: 10px;
		border: 2px solid #ccc;
		margin: 5px;
	}
</style>
