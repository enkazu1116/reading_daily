import { request } from './client';
import type { CreateReadingInput, Reading, UpdateReadingInput } from './types';

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
