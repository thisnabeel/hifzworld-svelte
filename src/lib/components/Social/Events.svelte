<script>
	import API from '$lib/api/api';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user';
	import { DateTime } from 'luxon';
	import { socialRoom, socialViewTab } from './social_store';

	let my_events = [];
	let friends_events = [];
	let newEvent = { title: '', date: '', time_zone: '', duration: 30, is_private: true };
	let isEditing = false;
	let editEventId = null;
	let formExpanded = false; // ✅ Controls form visibility

	let selectedHour = '';
	let selectedMinute = '00';
	let selectedAmPm = 'AM';

	// Get User's Current Time Zone
	let currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	// Commonly Used Time Zones
	let timeZones = [
		'UTC',
		'America/New_York',
		'America/Los_Angeles',
		'America/Chicago',
		'Europe/London',
		'Europe/Berlin',
		'Asia/Karachi',
		'Asia/Dubai',
		'Asia/Tokyo'
	];

	// Allowed Time Intervals (:00, :15, :30, :45)
	let timeIntervals = ['00', '15', '30', '45'];
	let amPmOptions = ['AM', 'PM'];
	let hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString()); // 1-12 hours

	// Set the min date to today
	let minDate = new Date().toISOString().slice(0, 10);

	onMount(() => {
		getEvents();
	});

	async function getEvents() {
		my_events = await API.get(`/events/users/${$user.id}`);
		friends_events = await API.get(`/events/users/${$user.id}/friends`);
	}

	async function createOrUpdateEvent() {
		// Collect missing fields
		let missingFields = [];

		if (!newEvent.title.trim()) missingFields.push('Recitation Title');
		if (!newEvent.date) missingFields.push('Date');
		if (!selectedHour) missingFields.push('Hour');
		if (!selectedMinute) missingFields.push('Minutes');
		if (!selectedAmPm) missingFields.push('AM/PM');
		if (!newEvent.time_zone) missingFields.push('Time Zone');
		if (!newEvent.duration) missingFields.push('Duration');

		// If any field is missing, alert the user
		if (missingFields.length > 0) {
			alert(`Please fill in the following fields:\n- ${missingFields.join('\n- ')}`);
			return;
		}

		// Construct a full datetime string in the user's selected time zone
		let formattedTime = `${selectedHour}:${selectedMinute} ${selectedAmPm}`;
		let formattedDateTime = `${newEvent.date} ${formattedTime}`;

		// Convert the datetime to the **user-selected timezone**
		let localizedDateTime = DateTime.fromFormat(formattedDateTime, 'yyyy-MM-dd h:mm a', {
			zone: newEvent.time_zone
		});

		// Convert the localized time to **ISO 8601 format** for Django
		newEvent.datetime = localizedDateTime.toISO(); // e.g., "2025-02-17T20:30:00-08:00"

		if (!newEvent.datetime) {
			alert('Invalid datetime conversion. Please check your inputs.');
			return;
		}

		console.log('Posting Event:', newEvent);

		if (isEditing) {
			await API.put(`/events/${editEventId}/`, newEvent);
		} else {
			await API.post('/events/', { ...newEvent, user: $user.id });
		}

		resetForm();
		getEvents();
	}

	function editEvent(event) {
		newEvent = { ...event };
		isEditing = true;
		editEventId = event.id;

		// Expand form when editing
		formExpanded = true;

		// Convert stored UTC datetime back to the selected time zone
		let dt = DateTime.fromISO(event.datetime).setZone(event.time_zone);

		// Extract date and time components
		newEvent.date = dt.toFormat('yyyy-MM-dd');
		selectedHour = dt.toFormat('h');
		selectedMinute = dt.toFormat('mm');
		selectedAmPm = dt.toFormat('a');
	}

	async function deleteEvent(eventId) {
		await API.delete(`/events/${eventId}/`);
		getEvents();
	}

	function resetForm() {
		newEvent = { title: '', date: '', time_zone: currentTimeZone, duration: '', is_private: true };
		selectedHour = '';
		selectedMinute = '00';
		selectedAmPm = 'AM';
		isEditing = false;
		editEventId = null;
		formExpanded = false; // ✅ Collapse form after submitting
	}

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

	function enterEvent(event) {
		socialViewTab.set('chatroom');
		socialRoom.set(event);
	}
</script>

<div class="container mt-4">
	<h2 class="text-center">📅 Testing Slots</h2>

	<!-- Accordion -->
	<div class="accordion" id="slotAccordion">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button {formExpanded ? '' : 'collapsed'}"
					type="button"
					on:click={() => (formExpanded = !formExpanded)}
				>
					{isEditing ? 'Edit Slot' : 'Create a Slot'}
				</button>
			</h2>
			<div class="accordion-collapse collapse {formExpanded ? 'show' : ''}">
				<div class="accordion-body">
					<div class="card shadow-sm p-4">
						<div class="row">
							<div class="col-md-6">
								<label class="form-label">I'll be reciting...</label>
								<input
									type="text"
									class="form-control"
									placeholder="Ex. Surah Isra, First quarter of Baqarah, etc."
									bind:value={newEvent.title}
									required
								/>
							</div>
							<div class="col-md-6">
								<label class="form-label">Time Zone</label>
								<select class="form-select" bind:value={newEvent.time_zone}>
									{#each timeZones as zone}
										<option value={zone}>{zone}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="row mt-3">
							<div class="col-md-4">
								<label class="form-label">Date</label>
								<input
									type="date"
									class="form-control"
									bind:value={newEvent.date}
									min={minDate}
									required
								/>
							</div>
							<div class="col-md-2">
								<label class="form-label">Hour</label>
								<select class="form-select" bind:value={selectedHour}>
									{#each hourOptions as hour}
										<option value={hour}>{hour}</option>
									{/each}
								</select>
							</div>
							<div class="col-md-2">
								<label class="form-label">Minute</label>
								<select class="form-select" bind:value={selectedMinute}>
									{#each timeIntervals as interval}
										<option value={interval}>{interval}</option>
									{/each}
								</select>
							</div>
							<div class="col-md-2">
								<label class="form-label">AM/PM</label>
								<select class="form-select" bind:value={selectedAmPm}>
									{#each amPmOptions as amPm}
										<option value={amPm}>{amPm}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="mt-4 d-flex justify-content-between">
							<button class="btn btn-success" on:click={createOrUpdateEvent}>
								{isEditing ? 'Update Event' : 'Create Event'}
							</button>
							<button class="btn btn-secondary" on:click={resetForm}>Cancel</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Event List -->
	<div class="mt-5">
		<h4 class="text-center">🎉 Your Events</h4>
		<ul class="list-group mt-3">
			{#each my_events as event}
				<li class="list-group-item d-flex justify-content-between align-items-center">
					<div>
						<strong>{formatDateTime(event.datetime_local, event.time_zone)}</strong> for {formatDuration(
							event.duration
						)}, {event.title}
					</div>
					<div>
						<button class="btn btn-info btn-sm me-2" on:click={() => enterEvent(event)}
							>Enter</button
						>
						<button class="btn btn-warning btn-sm me-2" on:click={() => editEvent(event)}
							>Edit</button
						>
						<button class="btn btn-danger btn-sm" on:click={() => deleteEvent(event.id)}
							>Delete</button
						>
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<div class="mt-5">
		<h4 class="text-center">🎉 Friends Events</h4>
		<ul class="list-group mt-3">
			{#each friends_events as event}
				<li class="list-group-item d-flex justify-content-between align-items-center">
					<div>
						<strong>{formatDateTime(event.datetime_local, event.time_zone)}</strong> for {formatDuration(
							event.duration
						)}, {event.title}
					</div>
					<div>
						<button class="btn btn-info btn-sm me-2" on:click={() => enterEvent(event)}
							>Enter</button
						>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</div>
