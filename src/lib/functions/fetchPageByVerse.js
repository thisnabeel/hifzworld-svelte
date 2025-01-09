import API from '$lib/api/api';
import { current_page, current_page_number, showVerseRefSearcher } from '$lib/stores/main';
import { closeModal } from 'svelte-modals';

export default async function fetchPageByVerse(verse_ref) {
	const page = await API.get(`find_page/1/${verse_ref}`);
	console.log({ page });
	current_page.set(page);
	current_page_number.set(page.page_number);
	closeModal();
	showVerseRefSearcher.set(false);
}
