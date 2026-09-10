import { request } from './client';
import type { BookSearchResult } from './types';

export function searchBooks(query: string): Promise<BookSearchResult[]> {
	return request<BookSearchResult[]>(`/books/search?q=${encodeURIComponent(query)}`);
}
