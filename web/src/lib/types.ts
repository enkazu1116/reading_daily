export type ReadingStatus = 'finished' | 'reading' | 'tsundoku';

export interface Reading {
	id: string;
	title: string;
	author: string;
	status: ReadingStatus;
	currentPage: number;
	totalPages: number | null;
	memo: string;
	thumbnailUrl?: string | null;
}

export interface Stats {
	finished: number;
	reading: number;
	tsundoku: number;
	pagesThisMonth: number;
}

export interface BookSearchResult {
	googleBooksId: string;
	title: string;
	author: string;
	thumbnailUrl?: string | null;
}

export interface CreateReadingInput {
	title: string;
	author: string;
	status?: ReadingStatus;
	currentPage?: number;
	totalPages?: number | null;
	memo?: string;
}

export interface UpdateReadingInput {
	status?: ReadingStatus;
	currentPage?: number;
	totalPages?: number | null;
	memo?: string;
}
