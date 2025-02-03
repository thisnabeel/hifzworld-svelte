<script>
	import { Peer } from 'peerjs';
	import API from '$lib/api/api';

	var peer = new Peer();
	let codeid = '';
	let videocurrent;
	let videoEl;
	let youid = '';

	let searchInput;
	let searching = false;
	let searchResults = [];

	import { debounce } from '$lib/functions/debounceBasic';
	import { user } from '$lib/stores/user';
	// GET YOU ID
	peer.on('open', (id) => {
		youid = id;
		console.log(id);
	});
	// IF ERROR CAN GET ID
	peer.on('error', (id) => {
		console.log('error id ' + id);
	});

	peer.on('connection', (conn) => {
		console.log('message....');
		conn.on('data', (data) => {
			console.log('new data ' + data);
		});
		conn.on('open', () => {
			console.log('new message');
		});
	});

	// HANDLE CONNECTTION
	peer.on('call', async (call) => {
		// open webcam
		await navigator.mediaDevices
			.getUserMedia({
				video: true,
				audio: true
			})
			.then((stream) => {
				call.answer(stream);
				call.on('stream', renderYouwebcam);
				videocurrent.srcObject = stream;
				videocurrent.play();
			})
			.catch((err) => console.log('err msg' + err));
	});
	// RENDER YOU WEBCAM HERE
	let renderYouwebcam = (stream) => {
		console.log(stream);
		videoEl.srcObject = stream;
		videoEl.play();
	};

	async function makeRoom() {
		var conn = peer.connect(codeid);
		conn.on('data', (data) => {
			console.log('new data ' + data);
		});
		conn.on('open', function () {
			conn.send('hi');
		});
		// OPEN YOU WEBAM
		await navigator.mediaDevices
			.getUserMedia({
				video: true,
				audio: true
			})
			.then((stream) => {
				let call = peer.call(codeid, stream);
				videocurrent.srcObject = stream;
				videocurrent.play();
				call.on('stream', renderYouwebcam);
			})
			.catch((err) => console.log('have error ' + err));
	}

	const searchUser = () => {
		if (searchInput) {
			searching = true;
			try {
				const combinedResults = $user.granted_permissions
					.map((g) => g.grantee)
					.concat($user.received_permissions.map((g) => g.granter))
					.filter((g) => {
						return (
							g.email.toLowerCase().includes(searchInput.toLowerCase()) ||
							(g.first_name + ' ' + g.last_name).toLowerCase().includes(searchInput.toLowerCase())
						);
					});

				const uniqueMap = new Map();
				combinedResults.forEach((user) => {
					if (!uniqueMap.has(user.id)) {
						uniqueMap.set(user.id, user);
					}
				});

				// Convert the Map values back into an array
				searchResults = Array.from(uniqueMap.values());
			} catch (error) {
				searchResults = [];
				console.error('Error searching for user:', error);
			} finally {
				searching = false;
			}
		} else {
			searchResults = [];
		}
	};
</script>

<div>
	<div class="flex">
		<div class="flex-50">
			<input
				type="text"
				class="form-control"
				placeholder="Search Friends List By Name or Email..."
				bind:value={searchInput}
				on:keyup={searchUser}
			/>
			{#if searching}
				<div class="btn btn-primary btn-block">Searching...</div>
			{/if}

			{#if searchResults}
				<br />
				<div class="clean-list search-results">
					{#each searchResults as result}
						<li>
							<i class="btn btn-outline-primary" on:click={makeRoom}>Make Room</i>
							{result.first_name}
							{result.last_name}, {result.email}
						</li>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- BUTTON CONNECT TO FRIEND -->
	<!-- <button
		on:click={async () => {
			var conn = peer.connect(codeid);
			conn.on('data', (data) => {
				console.log('new data ' + data);
			});
			conn.on('open', function () {
				conn.send('hi');
			});
			// OPEN YOU WEBAM
			await navigator.mediaDevices
				.getUserMedia({
					video: true,
					audio: true
				})
				.then((stream) => {
					let call = peer.call(codeid, stream);
					videocurrent.srcObject = stream;
					videocurrent.play();
					call.on('stream', renderYouwebcam);
				})
				.catch((err) => console.log('have error ' + err));
		}}
	>
		connect</button
	> -->

	<div class="video-chat">
		<div class="flex-50">
			<video bind:this={videoEl} width="400" height="400" autoplay="true">
				<track kind="captions" src="" />
			</video>
		</div>
		<div class="flex-50">
			<video bind:this={videocurrent} width="400" height="400" autoplay="true">
				<track kind="captions" src="" />
			</video>
		</div>
	</div>
	<!-- VIDEO YOU FRIEND TAG HTML -->
	<br />

	<!-- YOU FACE CAM HERE -->
</div>

<style>
	.video-chat {
		display: flex;
	}
	@media (max-device-width: 667px) and (-webkit-min-device-pixel-ratio: 2) {
		.video-chat {
			display: block;
		}
	}
</style>
