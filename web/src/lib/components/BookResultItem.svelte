<script lang="ts">
	import type { BookSearchResult } from '$lib/api/types';

	let {
		book,
		busy = false,
		disabled = false,
		onselect
	}: {
		book: BookSearchResult;
		busy?: boolean;
		disabled?: boolean;
		onselect: (book: BookSearchResult) => void;
	} = $props();
</script>

<button
	type="button"
	class="book-result"
	onclick={() => onselect(book)}
	disabled={busy || disabled}
>
	{#if book.thumbnailUrl}
		<img class="book-result__thumbnail" src={book.thumbnailUrl} alt="" />
	{/if}
	<div>
		<p class="book-result__title">{book.title}</p>
		<p class="book-result__author">{book.author}</p>
	</div>
	<span>{busy ? '追加中…' : '追加'}</span>
</button>
