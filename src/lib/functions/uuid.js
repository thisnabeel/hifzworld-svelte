export default function (array) {
	const min = 100; // Minimum 3-digit number
	const max = 999; // Maximum 3-digit number

	let randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
	while (array.map((b) => b.id).includes(randomCode)) {
		randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
	}
	return randomCode;
}
