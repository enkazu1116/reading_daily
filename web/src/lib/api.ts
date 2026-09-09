import type {
	BookSearchResult,
	CreateReadingInput,
	Reading,
	Stats,
	UpdateReadingInput
} from './types';

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:48721';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const headers = new Headers(options.headers);
	if (options.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: 'include',
		headers
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || `Request failed: ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export function getReadings(): Promise<Reading[]> {
	return request<Reading[]>('/readings');
}

export function getReading(id: string): Promise<Reading> {
	return request<Reading>(`/readings/${id}`);
}

export function createReading(input: CreateReadingInput): Promise<Reading> {
	return request<Reading>('/readings', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export function createReadingFromBook(googleBooksId: string): Promise<Reading> {
	return request<Reading>('/readings/from-book', {
		method: 'POST',
		body: JSON.stringify({ googleBooksId })
	});
}

export function updateReading(id: string, input: UpdateReadingInput): Promise<Reading> {
	return request<Reading>(`/readings/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}

export function deleteReading(id: string): Promise<void> {
	return request<void>(`/readings/${id}`, {
		method: 'DELETE'
	});
}

export function searchBooks(query: string): Promise<BookSearchResult[]> {
	return request<BookSearchResult[]>(`/books/search?q=${encodeURIComponent(query)}`);
}

export function searchReadings(query: string): Promise<Reading[]> {
	return request<Reading[]>(`/search?q=${encodeURIComponent(query)}`);
}

export function getStats(): Promise<Stats> {
	return request<Stats>('/stats');
}
