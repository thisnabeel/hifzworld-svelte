import API from '$lib/api/api';
import { tocList } from '$lib/stores/main';

export default async function getSurahs() {
	tocList.set(await API.get('/mushafs/' + 1 + '/surahs'));
}
