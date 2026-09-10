import { deleteReading, getReading, updateReading } from '$lib/api';
import type { Reading, ReadingStatus } from '$lib/api/types';
import { refreshStats } from './stats.svelte';

export const readingDetail = $state({
	reading: null as Reading | null,
	status: 'reading' as ReadingStatus,
	currentPage: 0,
	totalPages: '',
	memo: '',
	loading: true,
	saving: false,
	deleting: false,
	error: ''
});

export async function loadReading(id: string): Promise<void> {
	readingDetail.loading = true;
	readingDetail.error = '';

	try {
		const data = await getReading(id);
		readingDetail.reading = data;
		readingDetail.status = data.status;
		readingDetail.currentPage = data.currentPage;
		readingDetail.totalPages = data.totalPages?.toString() ?? '';
		readingDetail.memo = data.memo ?? '';
	} catch (err) {
		readingDetail.error = err instanceof Error ? err.message : '読み込みに失敗しました';
		readingDetail.reading = null;
	} finally {
		readingDetail.loading = false;
	}
}

export async function saveReading(): Promise<void> {
	if (!readingDetail.reading) return;

	readingDetail.saving = true;
	readingDetail.error = '';

	try {
		readingDetail.reading = await updateReading(readingDetail.reading.id, {
			status: readingDetail.status,
			currentPage: readingDetail.currentPage,
			totalPages: readingDetail.totalPages.trim() ? Number(readingDetail.totalPages) : null,
			memo: readingDetail.memo
		});
		await refreshStats();
	} catch (err) {
		readingDetail.error = err instanceof Error ? err.message : '保存に失敗しました';
	} finally {
		readingDetail.saving = false;
	}
}

export async function removeReading(): Promise<void> {
	if (!readingDetail.reading) return;

	readingDetail.deleting = true;
	readingDetail.error = '';

	try {
		await deleteReading(readingDetail.reading.id);
		await refreshStats();
	} catch (err) {
		readingDetail.error = err instanceof Error ? err.message : '削除に失敗しました';
		readingDetail.deleting = false;
		throw err;
	}
}
