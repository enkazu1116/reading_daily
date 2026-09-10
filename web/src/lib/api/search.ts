import { request } from './client';
import type { Reading } from './types';

export function searchReadings(query: string): Promise<Reading[]> {
	return request<Reading[]>(`/search?q=${encodeURIComponent(query)}`);
}
