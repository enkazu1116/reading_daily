<script lang="ts">
	import type { BookSearchResult } from '$lib/api/types';
	import { bookSearch } from '$lib/stores/book-search.svelte';
	import BookResultItem from './BookResultItem.svelte';

	let {
		onselect
	}: {
		onselect: (book: BookSearchResult) => void;
	} = $props();
</script>

<section class="stack">
	<label class="field">
		Google Books で検索
		<input
			class="input"
			type="search"
			placeholder="タイトルや著者"
			bind:value={bookSearch.query}
		/>
	</label>

	{#if bookSearch.searching}
		<p>検索中…</p>
	{:else if bookSearch.results.length > 0}
		<ul class="book-results">
			{#each bookSearch.results as book (book.googleBooksId)}
				<li>
					<BookResultItem
						{book}
						busy={bookSearch.addingId === book.googleBooksId}
						disabled={bookSearch.manualSaving}
						onselect={onselect}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</section>
