import { request } from './client';
import type { Stats } from './types';

export function getStats(): Promise<Stats> {
	return request<Stats>('/stats');
}
