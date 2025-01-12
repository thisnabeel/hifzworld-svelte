export function debounce(callback, delay = 300) {
	let timeout;

	return (...args) => {
		// Clear the previous timer
		if (timeout) {
			clearTimeout(timeout);
		}

		// Start a new timer
		timeout = setTimeout(() => {
			callback(...args); // Execute the callback with the latest arguments
		}, delay);
	};
}
