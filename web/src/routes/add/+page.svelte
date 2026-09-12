<script lang="ts">
	import { goto } from '$app/navigation';
	import BackLink from '$lib/components/BackLink.svelte';
	import BookSearchPanel from '$lib/components/BookSearchPanel.svelte';
	import ManualAddForm from '$lib/components/ManualAddForm.svelte';
	import type { BookSearchResult } from '$lib/api/types';
	import {
		addFromBook,
		addManualReading,
		bookSearch,
		searchForBooks
	} from '$lib/stores/book-search.svelte';

	$effect(() => {
		const timer = setTimeout(() => {
			searchForBooks(bookSearch.query);
		}, 300);

		return () => clearTimeout(timer);
	});

	async function handleSelect(book: BookSearchResult) {
		try {
			const id = await addFromBook(book);
			await goto(`/readings/${id}`);
		} catch {
			// error is stored in bookSearch.error
		}
	}

	async function handleManualAdd() {
		try {
			const id = await addManualReading();
			await goto(`/readings/${id}`);
		} catch {
			// error is stored in bookSearch.error
		}
	}
</script>

<div class="page">
	<BackLink />

	<h1 class="page-title">本を追加</h1>

	<BookSearchPanel onselect={handleSelect} />

	<ManualAddForm onsubmit={handleManualAdd} />

	{#if bookSearch.error}
		<p class="error-message">{bookSearch.error}</p>
	{/if}
</div>
