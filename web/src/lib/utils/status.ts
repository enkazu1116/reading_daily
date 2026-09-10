import type { ReadingStatus } from '$lib/api/types';

export const statusLabels: Record<ReadingStatus, string> = {
	finished: '読了',
	reading: '読書中',
	tsundoku: '積読'
};
