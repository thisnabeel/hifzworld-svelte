<script>
	import VideoChat from '$lib/components/VideoChat/Index.svelte';
	import { user } from '$lib/stores/user';

	import { socialRoom as event } from './social_store';
	import { DateTime } from 'luxon';

	// Function to format datetime
	function formatDateTime(datetimeStr, timeZone) {
		if (!datetimeStr) return 'Invalid time';
		let dt = DateTime.fromISO(datetimeStr, { zone: timeZone });
		return dt.toFormat('h:mm a ZZZZ'); // Example: "5:00 PM PST"
	}

	// Function to format duration
	function formatDuration(duration) {
		return duration === '00:00:30' ? '30 min' : `${duration} min`;
	}

	$: console.log($event);
</script>

<div>
	<h1>Room</h1>
	{#if $event}
		<div>
			<li class=" d-flex justify-content-between align-items-center">
				<div>
					<strong>{formatDateTime($event.datetime_local, $event.time_zone)}</strong> for {formatDuration(
						$event.duration
					)}, {$event.title}
				</div>
			</li>
		</div>
		<hr />
	{/if}
	{#if $event}
		<VideoChat event={$event} />
	{/if}
</div>
