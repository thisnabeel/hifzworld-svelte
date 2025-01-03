<script>
	import API from '$lib/api/api';
	import { onMount, onDestroy } from 'svelte';
	import thirteen_liner from '$lib/functions/thirteen_liner';
	import { user } from '$lib/stores/user';
	import save from '$lib/functions/debounce';
	import {
		blind,
		user_segments,
		branch,
		user_branch_pages,
		selected_user_page,
		current_page_number
	} from '$lib/stores/main';
	import BranchesHeader from '../Branches/Header/BranchesHeader.svelte';

	let unsubscribe;

	let imageSrc = null;
	let canvas;
	let context;
	let isDrawing = false;
	let undoStack = [];
	let redoStack = [];
	let debugMode = false;
	let showPaths = true; // New variable to toggle path visibility
	let drawnPaths = [];
	let img; // Declare img as a global variable
	let inverted = false;
	// let highlightTransparency = 0.9; // Adjust the value as needed
	// let highlightColor = `rgba(0, 0, 0, ${highlightTransparency})`;

	let highlightTransparency = 0.3; // Adjust the value as needed
	let highlightColor = `rgba(255, 255, 0, ${highlightTransparency})`;

	let saving = -1;

	let touchId; // To track the touch ID for drawing
	let touchPos; // To store the touch position
	let clickStartY = null; // Variable to store the x-coordinate where the click started

	let page;

	onMount(() => {
		// if ($user) {
		// 	if ($current_page_number) {
		// 		getPage();
		// 	}
		// }

		if (!canvas) {
			console.error('Canvas element not found');
			return;
		}

		context = canvas.getContext('2d');
		if (!context) {
			console.error('Failed to initialize canvas context');
			return;
		}

		console.log('Canvas and context are ready');

		unsubscribe = current_page_number.subscribe((p) => {
			console.log('got ', p);
			getPage(p); // Handle the page retrieval
		});
	});

	onDestroy(() => {
		closePage();

		// Unsubscribe from current_page_number
		if (unsubscribe) {
			unsubscribe();
		}
	});
	// $: getPage($current_page_number);

	async function updatePageRef() {
		await API.put(`/mushaf_pages/${page.id}/`, {
			mushaf: page.mushaf,
			verse_ref_start: page.verse_ref_start,
			verse_ref_end: page.verse_ref_end
		});
	}

	async function getImageSrc() {
		page = await API.get(`/mushafs/1/pages/${$current_page_number}`);
		console.log({ page });
		imageSrc = page.image_s3_url;
		beginPage();
	}

	// blind.subscribe((payload) => {
	// 	if (page && user_page && payload) {
	// 		redrawCanvas();
	// 	}
	// });
	async function fetchUserPage() {
		console.log('FETCHING USER');
		const user_pages = await API.get(`/users/${$user.id}/pages/${page.id}/branch/${$branch.id}`);
		if (user_pages) {
			console.log({ user_pages });
			user_branch_pages.set(user_pages);
			selected_user_page.set(user_pages[0]);
		} else {
			console.log('not found');
		}
	}

	selected_user_page.subscribe((p) => {
		if (p) {
			if (p.drawn_paths) {
				drawnPaths = p.drawn_paths;
				redrawCanvas();
			}
			saving = 1;
		}
	});

	function beginPage() {
		if (!canvas) {
			console.error('Canvas element not found');
			return;
		}

		img = new Image();
		img.src = imageSrc;

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			context = canvas.getContext('2d');
			context.drawImage(img, 0, 0, img.width, img.height);
			saveToUndoStack();
			fetchUserPage();
		};

		// Setup the event listener when the component is mounted
		if (typeof document !== 'undefined') {
			// document.addEventListener('click', handleDebugClick);
			canvas.addEventListener('touchstart', handleTouchStart);
			canvas.addEventListener('touchmove', handleTouchMove);
			canvas.addEventListener('touchend', handleTouchEnd);
			adjustCanvasSize(); // Call the function to adjust canvas size on mount
		}
	}

	function adjustCanvasSize() {
		// Get the dimensions of the container div
		const containerWidth = canvas.parentElement.clientWidth;
		const containerHeight = canvas.parentElement.clientHeight;

		// Set the canvas size to fit the container while maintaining the aspect ratio
		const aspectRatio = img.width / img.height;
		let newWidth, newHeight;

		if (containerWidth / aspectRatio < containerHeight) {
			newWidth = containerWidth;
			newHeight = containerWidth / aspectRatio;
		} else {
			newWidth = containerHeight * aspectRatio;
			newHeight = containerHeight;
		}

		canvas.width = newWidth;
		canvas.height = newHeight;
		redrawCanvas(); // Redraw the canvas after adjusting the size
	}

	function closePage() {
		if (typeof document !== 'undefined') {
			// document.removeEventListener('click', handleDebugClick);
			if (canvas) {
				canvas.removeEventListener('touchstart', handleTouchStart);
				canvas.removeEventListener('touchmove', handleTouchMove);
				canvas.removeEventListener('touchend', handleTouchEnd);
			}
		}
		drawnPaths = [];
	}

	function handleTouchStart(event) {
		event.preventDefault();
		const touch = event.touches[0];

		touchId = touch.identifier;
		touchPos = getTouchPos(touch);
		handleBrushStart(touchPos);
	}

	function handleTouchMove(event) {
		event.preventDefault();
		const touch = getTouchById(event, touchId);
		if (touch) {
			touchPos = getTouchPos(touch);
			handleBrushMove(touchPos);
		}
	}

	function handleTouchEnd(event) {
		const touch = getTouchById(event, touchId);
		if (touch) {
			if (isDrawing) {
				// If drawing, save the path
				isDrawing = false;
				saveToUndoStack();
			}
		}
	}

	function getTouchPos(touch) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		let scrollPosition = 0;
		// console.log({ scrollPosition });
		if (window.innerWidth < 768) {
			scrollPosition = window.scrollY;
		}
		// Use `pageX` and `pageY` to get the absolute coordinates on the page
		const x_sanitize = (touch.pageX - rect.left) * scaleX;
		const y_sanitize = (touch.pageY - rect.top - scrollPosition) * scaleY;

		return {
			x: Math.round(x_sanitize),
			y: Math.round(y_sanitize)
		};
	}

	function getTouchById(event, id) {
		for (let i = 0; i < event.changedTouches.length; i++) {
			if (event.changedTouches[i].identifier === id) {
				return event.changedTouches[i];
			}
		}
		return null;
	}

	async function getPage(trigger) {
		closePage();
		getImageSrc($current_page_number);
	}

	function getMousePos(event) {
		const rect = canvas.getBoundingClientRect();

		const x_sanitize = event.clientX - rect.left;
		const y_sanitize = event.clientY - rect.top;

		return {
			x: Math.round(x_sanitize),
			y: Math.round(y_sanitize)
		};
	}

	function saveToUndoStack() {
		// undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
		// redoStack = [];
	}

	function handleBrushStart(pos) {
		// console.log({ positionExists });
		clickStartY = pos.y;
		// console.log('startY', pos.y);
		drawnPaths.push([{ x: pos.x, y: pos.y, color: highlightColor }]); // Default color is yellow
	}

	function handleBrushMove(pos) {
		// Check if the specified position exists in drawnPaths
		const positionExists = doesPosExistInDrawnPaths(pos);
		// console.log(pos);

		// If debugMode is enabled and the position exists, log the message and return
		if (debugMode) {
			if (positionExists) {
				// console.log('Position exists in drawnPaths:', pos);
				removePointFromDrawnPaths(pos);
			}

			return;
		}

		// If the position doesn't exist, push the new position to drawnPaths
		drawnPaths[drawnPaths.length - 1].push({
			x: pos.x,
			y: clickStartY,
			color: highlightColor
		});
		saving = -1;
		redrawCanvas();
	}

	function handleMouseDown(event) {
		isDrawing = true;
		const pos = getMousePos(event);
		handleBrushStart(pos);
	}

	function handleMouseMove(event) {
		if (!isDrawing) return;
		const pos = getMousePos(event);
		handleBrushMove(pos);
	}

	// Function to check if the specified position exists in drawnPaths
	function doesPosExistInDrawnPaths(pos) {
		const coordinates = getAllCoordinates(drawnPaths);

		// Define the range of points to check in all directions
		const range = 30;

		for (const point of coordinates) {
			for (let i = -range; i <= range; i++) {
				for (let j = -range; j <= range; j++) {
					// Check if the current point is within the specified range around the target position
					if (point.x === pos.x + i && point.y === pos.y + j) {
						return true;
					}
				}
			}
		}

		return false;
	}

	function removePointFromDrawnPaths(pos) {
		const x = pos.x;
		const y = pos.y;
		const radius = 20; // Number of points to remove in each direction

		// Create a new array without the points to be removed
		const newDrawnPaths = drawnPaths.map((path) =>
			path.filter(
				(point) =>
					point.x < x - radius ||
					point.x > x + radius ||
					point.y < y - radius ||
					point.y > y + radius
			)
		);

		// Update the drawnPaths variable with the new array

		drawnPaths = newDrawnPaths;
		// console.log(drawnPaths.map((p) => p.length));

		redrawCanvas();
	}

	function handleMouseUp() {
		if (isDrawing) {
			isDrawing = false;
			saveToUndoStack();
		}
	}

	function undo() {
		if (undoStack.length > 1) {
			redoStack.push(undoStack.pop());
			context.putImageData(undoStack[undoStack.length - 1], 0, 0);
			if (!debugMode) {
				drawnPaths.pop(); // Remove the last drawn path when undoing
			}
		}
	}

	function redo() {
		if (redoStack.length > 0) {
			undoStack.push(redoStack.pop());
			context.putImageData(undoStack[undoStack.length - 1], 0, 0);
			if (!debugMode) {
				// Save the current path to the array
				drawnPaths.push([]);
			}
		}
	}

	function toggleDebugMode() {
		debugMode = !debugMode;
		if (debugMode) {
			document.addEventListener('click', handleDebugClick);
		} else {
			document.removeEventListener('click', handleDebugClick);
		}
	}

	let clickedIndex = -1; // Initialize clickedIndex

	function getClickedPathIndex(mousePos) {
		let clickThreshold = 10; // Adjust the threshold as needed

		for (let i = 0; i < drawnPaths.length; i++) {
			const path = drawnPaths[i];
			for (let j = 0; j < path.length - 1; j++) {
				const start = path[j];
				const end = path[j + 1];

				// Calculate the distance from the mouse to the line segment defined by start and end points
				const distToSegment = getDistanceToSegment(mousePos, start, end);

				if (distToSegment < clickThreshold) {
					// console.log('Clicked on drawn path:', i);
					return i;
				}
			}
		}

		// console.log('No path found');
		return -1;
	}

	// Function to calculate the distance from a point to a line segment
	function getDistanceToSegment(point, start, end) {
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const dotProduct =
			((point.x - start.x) * dx + (point.y - start.y) * dy) /
			Math.pow(getLength({ x: dx, y: dy }), 2);

		const closestX = start.x + dotProduct * dx;
		const closestY = start.y + dotProduct * dy;

		if (dotProduct < 0) {
			return getDistance(point, start); // Closest point is the start of the segment
		} else if (dotProduct > 1) {
			return getDistance(point, end); // Closest point is the end of the segment
		}

		return getDistance(point, { x: closestX, y: closestY });
	}

	// Function to calculate the Euclidean distance between two points
	function getDistance(point1, point2) {
		const dx = point2.x - point1.x;
		const dy = point2.y - point1.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// Function to calculate the length of a vector
	function getLength(vector) {
		return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	}

	function handleDebugClick(event) {
		return;
		if (!debugMode) return;

		event.preventDefault(); // Prevent the default click behavior

		// Use the appropriate event coordinates based on the event type
		const pos = event.type === 'click' ? getMousePos(event) : getTouchPos(event.changedTouches[0]);
		clickedIndex = getClickedPathIndex(pos);

		if (clickedIndex !== -1) {
			console.log('Clicked on drawn path:', drawnPaths[clickedIndex]);
			// Remove the clicked path
			drawnPaths.splice(clickedIndex, 1);
			redrawCanvas();
		}
	}

	function findIntersectingPoints(pathIndex, mousePos) {
		const clickThreshold = 10; // Adjust the threshold as needed
		const intersectingPoints = [];

		const path = drawnPaths[pathIndex];
		for (let j = 0; j < path.length - 1; j++) {
			const start = path[j];
			const end = path[j + 1];

			// Calculate the distance from the mouse to the line segment defined by start and end points
			const distToSegment = getDistanceToSegment(mousePos, start, end);

			if (distToSegment < clickThreshold) {
				// If the distance is below the threshold, consider it as an intersecting point
				intersectingPoints.push(path[j], path[j + 1]);
			}
		}

		return intersectingPoints;
	}

	function redrawCanvas() {
		if (!canvas || !context) {
			console.warn('Canvas or context is not initialized yet.');
			return;
		}
		console.log('Context Initialized');
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(img, 0, 0, img.width, img.height);

		// Draw paths only if showPaths is true
		if (!inverted) {
			drawnPaths.forEach((path) => {
				if (path.length > 1) {
					context.beginPath();
					context.moveTo(path[0].x, path[0].y);
					path.forEach((point) => {
						context.lineTo(point.x, point.y);
						if ($blind) {
							context.strokeStyle = 'rgba(0,0,0, 1)';
						} else {
							context.strokeStyle = point.color;
						}
					});
					context.lineWidth = 38;
					context.lineCap = 'round';
					context.lineJoin = 'round';
					context.stroke();
				}
			});
		}

		if (inverted) {
			const maskCanvas = document.createElement('canvas');
			const maskContext = maskCanvas.getContext('2d');

			// Set the dimensions of the mask canvas
			maskCanvas.width = img.width;
			maskCanvas.height = img.height;

			// Step 2: Draw the inverted paths on the masking layer
			maskContext.lineWidth = 38;
			maskContext.lineCap = 'round';
			maskContext.lineJoin = 'round';

			drawnPaths.forEach((path) => {
				if (path.length > 1) {
					maskContext.beginPath();
					maskContext.moveTo(path[0].x, path[0].y);
					path.forEach((point) => {
						maskContext.lineTo(point.x, point.y);
					});
					maskContext.stroke();
				}
			});

			// Step 3: Set the global composite operation to "destination-out"
			context.globalCompositeOperation = 'destination-in';

			// Step 4: Draw the masking layer on the main canvas
			context.drawImage(maskCanvas, 0, 0);

			// Step 5: Reset the global composite operation to the default
			context.globalCompositeOperation = 'source-over';
		}

		// console.log({ drawnPaths });
	}
	async function saveDrawingToDatabase() {
		// Now, you can save `drawingData` to your database
		// console.log();
		saving = 0;
		const drawn_payload = drawnPaths.filter((a) => a.length > 0);

		const hash = {
			drawn_paths: drawn_payload.length > 0 ? drawn_payload : null,
			mushaf_page: page.id,
			branch: $branch.id,
			user: $user.id
		};

		const res = await API.post(`/user_pages`, hash);
		console.log({ res });
		saving = 1;

		user_branch_pages.set([res, ...$user_branch_pages]);
		selected_user_page.set(res);
		// console.log(getAllCoordinates());
		// const bounds = canvas.getBoundingClientRect();
		// console.log({ bounds });
	}

	function getAllCoordinates() {
		const coordinates = [];

		// Iterate through the nested array
		drawnPaths.forEach((innerArray) => {
			innerArray.forEach((obj) => {
				// Extract and push x and y coordinates
				coordinates.push({ x: obj.x, y: obj.y });
			});
		});

		return coordinates;
	}

	function generatePoints(xMax, yMax) {
		const points = [];
		for (let x = 0; x <= xMax; x++) {
			for (let y = 0; y <= yMax; y++) {
				points.push({ x, y });
			}
		}
		return points;
	}

	async function quiz() {
		if ($user_segments.length < 1) {
			const segments = await API.get('/users/' + $user.id + '/progress');
			user_segments.set(segments);
		}
		const user_segment = $user_segments[Math.floor(Math.random() * $user_segments.length)];
		// selectPage(user_segment.page_number);
		current_page_number.set(user_segment.page_number);
		getPage();
		// console.log({ $user_segments });
		// console.log({ user_segment });
	}
</script>

<BranchesHeader />

<div class="canvas-container">
	<canvas
		bind:this={canvas}
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
	/>
</div>

<div class="controls">
	<br />
	<!-- <button on:click={undo}>Undo</button>
        <button on:click={redo}>Redo</button> -->
	<button
		on:click={() => {
			blind.set(!$blind);
			redrawCanvas();
		}}
		class="btn"><i class="fa {$blind ? 'fa-eye-slash' : 'fa-eye'}" /></button
	>
	<button on:click={() => (debugMode = false)} class="btn {debugMode ? '' : 'btn-success'}"
		><i class="fa fa-pen" /></button
	>
	<button on:click={() => (debugMode = true)} class="btn {debugMode ? 'btn-warning' : ''}"
		><i class="fa fa-eraser" /></button
	>
	<!-- <button
		on:click={() => {
			showPaths = !showPaths;
			redrawCanvas();
		}}
		class="btn"><i class="fa {showPaths ? 'fa-eye' : 'fa-eye-slash'}" /></button
	> -->

	<button
		on:click={() => {
			inverted = !inverted;
			console.log({ inverted });
			redrawCanvas();
		}}
		class="btn">Invert</button
	>

	<input
		type="number"
		class="form-control text-center"
		bind:value={$current_page_number}
		on:change={getPage}
	/>

	{#if page && page.id}
		<div class="row">
			<div class="col-lg-6 col-md-6 col-sm-6">
				<input
					style="font-size: 20px;"
					placeholder="Verse Start..."
					type="text"
					class="form-control"
					on:change={() => updatePageRef()}
					bind:value={page.verse_ref_start}
				/>
			</div>
			<div class="col-lg-6 col-md-6 col-sm-6">
				<input
					on:change={() => updatePageRef()}
					bind:value={page.verse_ref_end}
					style="font-size: 20px;"
					placeholder="Verse End..."
					type="text"
					class="form-control"
				/>
			</div>
		</div>
	{/if}
	<div class="movePage flex">
		<span
			class="btn btn-info"
			on:click={() => {
				current_page_number.set($current_page_number + 1);
				getPage();
			}}><i class="fa fa-arrow-left" /></span
		>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span
			class="btn btn-info"
			on:click={() => {
				if ($current_page_number < 3) return;
				current_page_number.set($current_page_number - 1);
				getPage();
			}}><i class="fa fa-arrow-right" /></span
		>
	</div>
	{#if false}
		<div class="colors">
			<div
				class="yellow"
				on:click={() => (highlightColor = `rgba(255, 255, 0, ${highlightTransparency})`)}
			/>
			<!-- <div class="black" on:click={() => (highlightColor = `rgba(52, 73, 94,1.0)`)} /> -->
			<div class="transparent" on:click={() => (highlightColor = `rgba(255, 255, 255,1.0)`)} />
		</div>
	{/if}

	<button class="btn btn-outline-info quiz" on:click={quiz}>
		<i class="fa fa-refresh" />
	</button>

	<button
		class="btn btn-outline-info save-page"
		class:btn-primary={saving == -1}
		class:btn-info={saving == 0}
		class:btn-success={saving == 1}
		on:click={saveDrawingToDatabase}
	>
		{#if saving === -1}
			<i class="fa fa-save" /> ?
		{:else if saving === 0}
			Saving
		{:else if saving === 1}
			Saved
		{/if}
	</button>

	<br />
	<!-- svelte-ignore a11y-click-events-have-key-events -->
</div>

<style>
	/* canvas {
		border: 1px solid #000;
	} */

	.canvas-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: auto; /* Set the height of the parent div to the full viewport height */
		margin: 0; /* Remove default margin to avoid unnecessary spacing */
	}

	canvas {
		border: 1px solid #000;
		max-width: 100%; /* Ensure the canvas doesn't exceed the container's width */
		max-height: 100%; /* Ensure the canvas doesn't exceed the container's height */
	}

	.colors {
		display: block;
		text-align: center;
		margin: 10px;
	}

	.colors div {
		border: 1px solid black;
		width: 40px;
		height: 40px;
		display: inline-block;
	}

	.colors .black {
		background-color: #000;
	}

	.colors .yellow {
		background-color: yellow;
	}

	.flex {
		display: flex;
	}

	.movePage > span {
		flex: 1 1 50%;
		font-size: 34px;
		margin: 10px;
	}

	.controls {
		text-align: center;
	}

	.controls input {
		margin-top: 10px;
		font-size: 40px;
	}

	.save-page {
		position: fixed;
		bottom: 10px;
		right: 10px;
		z-index: 9999;
	}

	.quiz {
		position: fixed;
		bottom: 50px;
		right: 10px;
		z-index: 9999;
	}
</style>
