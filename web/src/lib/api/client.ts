const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:48721';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
