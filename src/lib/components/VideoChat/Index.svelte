<!-- VideoChat.svelte -->
<!-- VideoChat.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';

	export let event;

	let localVideo;
	let remoteVideo;
	let localStream;
	let peerConnection;
	let websocket;

	let isConnected = false;
	let isFull = false;
	let videoEnabled = true;
	let audioEnabled = true;
	let debugLogs = [];
	let isDebugOpen = false;
	let isNegotiating = false;
	let reconnectAttempts = 0;
	const maxReconnectAttempts = 5;
	let reconnectTimeout;
	let isWebRTCReady = false;

	function addDebugLog(message) {
		const timestamp = new Date().toISOString();
		debugLogs = [...debugLogs, `${timestamp}: ${message}`];
	}

	let signalingServer;

	// Reactive statement to build signaling server URL when event is available
	$: {
		if (event && event.unique_code) {
			const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
			const baseURL = import.meta.env.VITE_API_URL;

			// More robust URL parsing for production
			let hostname;
			try {
				const url = new URL(baseURL);
				hostname = url.hostname;
				// Only add port if it's not the default port for the protocol
				if (
					url.port &&
					!(
						(url.protocol === 'https:' && url.port === '443') ||
						(url.protocol === 'http:' && url.port === '80')
					)
				) {
					hostname += `:${url.port}`;
				}
			} catch (e) {
				console.error('Failed to parse baseURL:', baseURL, e);
				// Fallback for production
				if (baseURL.includes('hifzworld.onrender.com')) {
					hostname = 'hifzworld.onrender.com';
				} else {
					hostname = baseURL.split('//')[1]?.split('/')[0] || 'localhost:8000';
				}
			}

			signalingServer = `${wsUrl}${hostname}/ws/signaling/${event.unique_code}/`;
			addDebugLog(`Building signaling server URL: ${signalingServer}`);
			addDebugLog(`Base URL: ${baseURL}, Hostname: ${hostname}`);
		} else {
			addDebugLog('Event or unique_code not available for signaling server');
		}
	}

	async function initWebRTC() {
		try {
			localStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true
			});

			if (localVideo) {
				localVideo.srcObject = localStream;
			}
			addDebugLog('Local stream initialized');

			const configuration = {
				iceServers: [
					{ urls: 'stun:stun.l.google.com:19302' },
					{ urls: 'stun:stun1.l.google.com:19302' },
					{ urls: 'stun:stun2.l.google.com:19302' },
					{ urls: 'stun:stun3.l.google.com:19302' },
					{ urls: 'stun:stun4.l.google.com:19302' }
				],
				iceCandidatePoolSize: 10
			};

			peerConnection = new RTCPeerConnection(configuration);

			localStream.getTracks().forEach((track) => {
				peerConnection.addTrack(track, localStream);
			});

			peerConnection.onicecandidate = (event) => {
				if (event.candidate && websocket && websocket.readyState === WebSocket.OPEN) {
					websocket.send(
						JSON.stringify({
							type: 'ice-candidate',
							candidate: event.candidate
						})
					);
					addDebugLog('ICE candidate sent');
				} else if (event.candidate) {
					addDebugLog('Cannot send ICE candidate: WebSocket not ready');
				}
			};

			peerConnection.oniceconnectionstatechange = () => {
				const state = peerConnection.iceConnectionState;
				addDebugLog(`ICE connection state: ${state}`);

				if (state === 'connected' || state === 'completed') {
					isConnected = true;
					isNegotiating = false;
					addDebugLog('✅ WebRTC peer connection established!');
				} else if (state === 'failed' || state === 'disconnected') {
					isConnected = false;
					isNegotiating = false;
					addDebugLog(`❌ WebRTC connection failed: ${state}`);
				}
			};

			peerConnection.ontrack = (event) => {
				addDebugLog(`Remote track received: ${event.track.kind}`);
				if (event.streams && event.streams[0]) {
					if (remoteVideo) {
						remoteVideo.srcObject = event.streams[0];
						addDebugLog('Remote stream set to video element');
					} else {
						addDebugLog('Warning: remoteVideo element not ready yet');
						// Set up a delayed retry
						setTimeout(() => {
							if (remoteVideo && event.streams[0]) {
								remoteVideo.srcObject = event.streams[0];
								addDebugLog('Remote stream set to video element (delayed)');
							}
						}, 100);
					}
				} else {
					addDebugLog('Warning: No streams in ontrack event');
				}
			};

			isWebRTCReady = true;
			addDebugLog('WebRTC initialized and ready for signaling');
		} catch (error) {
			addDebugLog(`Error initializing WebRTC: ${error.message}`);
			isWebRTCReady = false;
		}
	}

	async function connectToSignalingServer() {
		if (!signalingServer) {
			addDebugLog('Cannot connect: signaling server URL not ready');
			return;
		}

		try {
			addDebugLog(
				`Connecting to signaling server: ${signalingServer} (Attempt ${reconnectAttempts + 1})`
			);

			// Close existing connection if any
			if (websocket && websocket.readyState !== WebSocket.CLOSED) {
				websocket.close();
			}

			websocket = new WebSocket(signalingServer);

			websocket.onopen = () => {
				addDebugLog('WebSocket connected successfully');
				addDebugLog(`Connected to room: ${event.unique_code}`);
				reconnectAttempts = 0; // Reset on successful connection
				websocket.send(JSON.stringify({ type: 'check-room' }));
			};

			websocket.onmessage = async (evt) => {
				const message = JSON.parse(evt.data);
				addDebugLog(`Received message: ${message.type}`);
				addDebugLog(`Full message data: ${JSON.stringify(message)}`);

				switch (message.type) {
					case 'room-full':
						isFull = true;
						addDebugLog('Room is full');
						websocket.close();
						break;

					case 'user-joined':
						addDebugLog('User joined - checking WebRTC readiness');
						
						// Ensure WebRTC is ready before proceeding
						if (!isWebRTCReady || !peerConnection) {
							addDebugLog('WebRTC not ready yet, waiting...');
							setTimeout(() => {
								// Retry by sending check-room again
								if (websocket && websocket.readyState === WebSocket.OPEN) {
									websocket.send(JSON.stringify({ type: 'check-room' }));
								}
							}, 1000);
							break;
						}
						
						isNegotiating = true;
						isConnected = false; // Don't set connected until we have actual connection
						
						try {
							// Create offer according to WebRTC best practices (Step 4 from guide)
							const offer = await peerConnection.createOffer({
								offerToReceiveAudio: true,
								offerToReceiveVideo: true
							});
							
							await peerConnection.setLocalDescription(offer);
							addDebugLog('Local description set for offer');

							if (websocket && websocket.readyState === WebSocket.OPEN) {
								websocket.send(
									JSON.stringify({
										type: 'offer',
										offer: offer
									})
								);
								addDebugLog('Offer sent after user joined');
							} else {
								addDebugLog('Cannot send offer: WebSocket not ready');
								isNegotiating = false;
							}
						} catch (error) {
							addDebugLog(`Error creating offer: ${error.message}`);
							isNegotiating = false;
						}
						break;

					case 'offer':
						try {
							isNegotiating = true;
							addDebugLog('Received offer, setting remote description');
							
							// Set remote description first (critical step)
							await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
							addDebugLog('Remote description set from offer');
							
							// Create answer with proper options
							const answer = await peerConnection.createAnswer();
							await peerConnection.setLocalDescription(answer);
							addDebugLog('Local description set for answer');

							if (websocket && websocket.readyState === WebSocket.OPEN) {
								websocket.send(
									JSON.stringify({
										type: 'answer',
										answer: answer
									})
								);
								addDebugLog('Answer sent successfully');
							} else {
								addDebugLog('Cannot send answer: WebSocket not ready');
								isNegotiating = false;
							}
						} catch (error) {
							isNegotiating = false;
							addDebugLog(`Error handling offer: ${error.message}`);
							console.error('Offer handling error:', error);
						}
						break;

					case 'answer':
						try {
							addDebugLog('Received answer, setting remote description');
							await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
							addDebugLog('Remote description set from answer - connection should be established');
						} catch (error) {
							isNegotiating = false;
							addDebugLog(`Error handling answer: ${error.message}`);
							console.error('Answer handling error:', error);
						}
						break;

					case 'ice-candidate':
						try {
							if (message.candidate && peerConnection && peerConnection.remoteDescription) {
								await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
								addDebugLog('ICE candidate added successfully');
							} else if (message.candidate) {
								// Store candidate for later if remote description isn't ready yet
								addDebugLog('ICE candidate received but remote description not ready - will add after');
							} else {
								addDebugLog('ICE candidate gathering completed on remote side');
							}
						} catch (error) {
							addDebugLog(`Error handling ICE candidate: ${error.message}`);
							console.error('ICE candidate error:', error);
						}
						break;

					case 'user-left':
						isConnected = false;
						if (remoteVideo) {
							remoteVideo.srcObject = null;
						}
						addDebugLog('Remote user left');
						break;
				}
			};

			websocket.onerror = (error) => {
				addDebugLog(`WebSocket error: ${error.message || 'Connection error occurred'}`);
				console.error('WebSocket error:', error);
			};

			websocket.onclose = (event) => {
				addDebugLog(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
				isConnected = false;
				if (remoteVideo) {
					remoteVideo.srcObject = null;
				}

				// Attempt reconnection for unexpected closures
				if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
					const delay = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
					addDebugLog(`Attempting reconnection in ${delay / 1000} seconds...`);

					reconnectTimeout = setTimeout(() => {
						reconnectAttempts++;
						connectToSignalingServer();
					}, delay);
				} else if (reconnectAttempts >= maxReconnectAttempts) {
					addDebugLog('Max reconnection attempts reached. Please refresh the page.');
				}
			};
		} catch (error) {
			addDebugLog(`Error connecting to signaling server: ${error.message}`);
		}
	}

	async function start() {
		if (!event || !event.unique_code) {
			addDebugLog('Cannot start: event or unique_code not available');
			return;
		}

		// Initialize WebRTC first (Step 1-3 from the guide)
		await initWebRTC();
		
		// Then connect to signaling server (Step 4-6 from the guide)
		await connectToSignalingServer();
	}

	// Reactive statement to start when event becomes available
	$: if (event && event.unique_code && signalingServer) {
		start();
	}

	onMount(() => {
		// Start will be called reactively when event is ready
	});

	function toggleVideo() {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			videoTrack.enabled = !videoTrack.enabled;
			videoEnabled = videoTrack.enabled;
			addDebugLog(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
		}
	}

	function toggleAudio() {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			audioTrack.enabled = !audioTrack.enabled;
			audioEnabled = audioTrack.enabled;
			addDebugLog(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
		}
	}

	onDestroy(() => {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
		}
		if (peerConnection) {
			peerConnection.close();
		}
		if (websocket) {
			websocket.close(1000, 'Component unmounting');
		}
	});
</script>

<!-- Rest of your template remains the same -->

<div class="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
	{#if isFull}
		<div
			class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
			role="alert"
		>
			<span class="block sm:inline">This room is full. Maximum 2 participants allowed.</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="relative">
			<video
				bind:this={localVideo}
				autoplay
				playsinline
				muted
				class="w-full rounded-lg bg-slate-900"
			/>
			<div class="absolute bottom-4 left-4 flex gap-2">
				<button
					on:click={toggleVideo}
					class="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
				>
					{#if videoEnabled}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polygon points="23 7 16 12 23 17 23 7" />
							<rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"
							/>
							<line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{/if}
				</button>
				<button
					on:click={toggleAudio}
					class="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
				>
					{#if audioEnabled}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<line x1="12" y1="19" x2="12" y2="23" />
							<line x1="8" y1="23" x2="16" y2="23" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="1" y1="1" x2="23" y2="23" />
							<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
							<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
							<line x1="12" y1="19" x2="12" y2="23" />
							<line x1="8" y1="23" x2="16" y2="23" />
						</svg>
					{/if}
				</button>
			</div>
			<div class="absolute top-2 left-2 px-2 py-1 bg-slate-800 text-white text-sm rounded">You</div>
		</div>

		<div class="relative">
			<video bind:this={remoteVideo} autoplay playsinline class="w-full rounded-lg bg-slate-900" />
			{#if !isConnected}
				<div
					class="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-50 rounded-lg"
				>
					<span class="text-white">Waiting for someone to join...</span>
				</div>
			{/if}
			{#if isConnected}
				<div class="absolute top-2 left-2 px-2 py-1 bg-slate-800 text-white text-sm rounded">
					Remote User
				</div>
			{/if}
		</div>
	</div>

	<div class="w-full">
		<button
			on:click={() => (isDebugOpen = !isDebugOpen)}
			class="w-full px-4 py-2 text-left bg-slate-100 hover:bg-slate-200 rounded-lg"
		>
			Debug Logs
			<span class="float-right">
				{isDebugOpen ? '▼' : '▶'}
			</span>
		</button>
		{#if isDebugOpen}
			<div class="bg-slate-100 p-4 rounded-lg max-h-64 overflow-y-auto mt-2">
				{#each debugLogs as log}
					<div class="font-mono text-sm mb-1">
						{log}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
