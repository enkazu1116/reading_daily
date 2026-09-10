import { createReading, createReadingFromBook, searchBooks } from '$lib/api';
import type { BookSearchResult } from '$lib/api/types';
import { refreshStats } from './stats.svelte';

export const bookSearch = $state({
	query: '',
	results: [] as BookSearchResult[],
	searching: false,
	error: '',
	addingId: null as string | null,
	manualTitle: '',
	manualAuthor: '',
	manualSaving: false
});

export async function searchForBooks(searchQuery: string): Promise<void> {
	if (!searchQuery.trim()) {
		bookSearch.results = [];
		return;
	}

	bookSearch.searching = true;
	bookSearch.error = '';

	try {
		bookSearch.results = await searchBooks(searchQuery.trim());
	} catch (err) {
		bookSearch.error = err instanceof Error ? err.message : '検索に失敗しました';
		bookSearch.results = [];
	} finally {
		bookSearch.searching = false;
	}
}

export async function addFromBook(book: BookSearchResult): Promise<string> {
	bookSearch.addingId = book.googleBooksId;
	bookSearch.error = '';

	try {
		const reading = await createReadingFromBook(book.googleBooksId);
		await refreshStats();
		return reading.id;
	} catch (err) {
		bookSearch.error = err instanceof Error ? err.message : '追加に失敗しました';
		bookSearch.addingId = null;
		throw err;
	}
}

export async function addManualReading(): Promise<string> {
	if (!bookSearch.manualTitle.trim() || !bookSearch.manualAuthor.trim()) {
		bookSearch.error = 'タイトルと著者を入力してください';
		throw new Error(bookSearch.error);
	}

	bookSearch.manualSaving = true;
	bookSearch.error = '';

	try {
		const reading = await createReading({
			title: bookSearch.manualTitle.trim(),
			author: bookSearch.manualAuthor.trim()
		});
		await refreshStats();
		return reading.id;
	} catch (err) {
		bookSearch.error = err instanceof Error ? err.message : '追加に失敗しました';
		bookSearch.manualSaving = false;
		throw err;
	}
}
