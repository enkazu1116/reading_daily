import { getReadings, searchReadings } from '$lib/api';
import type { Reading } from '$lib/api/types';

export const readingsList = $state({
	query: '',
	readings: [] as Reading[],
	loading: true,
	error: ''
});

export async function loadReadings(searchQuery: string): Promise<void> {
	readingsList.loading = true;
	readingsList.error = '';

	try {
		readingsList.readings = searchQuery.trim()
			? await searchReadings(searchQuery.trim())
			: await getReadings();
	} catch (err) {
		readingsList.error = err instanceof Error ? err.message : '読み込みに失敗しました';
		readingsList.readings = [];
	} finally {
		readingsList.loading = false;
	}
}
