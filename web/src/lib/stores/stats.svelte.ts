import { getStats } from '$lib/api';
import type { Stats } from '$lib/api/types';

const emptyStats: Stats = {
	finished: 0,
	reading: 0,
	tsundoku: 0,
	pagesThisMonth: 0
};

export const stats = $state<Stats>({ ...emptyStats });

export async function refreshStats(): Promise<void> {
	try {
		const data = await getStats();
		stats.finished = data.finished ?? 0;
		stats.reading = data.reading ?? 0;
		stats.tsundoku = data.tsundoku ?? 0;
		stats.pagesThisMonth = data.pagesThisMonth ?? 0;
	} catch {
		Object.assign(stats, emptyStats);
	}
}
