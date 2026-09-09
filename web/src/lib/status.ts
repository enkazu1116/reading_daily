import type { ReadingStatus } from './types';

export const statusLabels: Record<ReadingStatus, string> = {
	finished: '読了',
	reading: '読書中',
	tsundoku: '積読'
};
