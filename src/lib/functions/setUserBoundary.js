import API from '$lib/api/api';
import { user } from '$lib/stores/user';

export default async function setUserBoundary(starting_verse_boundary, ending_verse_boundary) {
	let u = { id: -1 };
	user.subscribe((payload) => {
		u = payload;
	});
	const res = await API.patch('users/' + u.id + '/update/', {
		starting_verse_boundary: starting_verse_boundary,
		ending_verse_boundary: ending_verse_boundary
	});
	user.set({
		...u,
		starting_verse_boundary: starting_verse_boundary,
		ending_verse_boundary: ending_verse_boundary
	});
}
