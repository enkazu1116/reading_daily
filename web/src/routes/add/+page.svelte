<script lang="ts">
	import { goto } from '$app/navigation';
	import { createReading, createReadingFromBook, searchBooks } from '$lib/api';
	import { refreshStats } from '$lib/stats';
	import type { BookSearchResult } from '$lib/types';

	let query = $state('');
	let results = $state<BookSearchResult[]>([]);
	let searching = $state(false);
	let addingId = $state<string | null>(null);
	let manualTitle = $state('');
	let manualAuthor = $state('');
	let manualSaving = $state(false);
	let error = $state('');

	async function runSearch(searchQuery: string) {
		if (!searchQuery.trim()) {
			results = [];
			return;
		}

		searching = true;
		error = '';

		try {
			results = await searchBooks(searchQuery.trim());
		} catch (err) {
			error = err instanceof Error ? err.message : '検索に失敗しました';
			results = [];
		} finally {
			searching = false;
		}
	}

	$effect(() => {
		const timer = setTimeout(() => {
			runSearch(query);
		}, 300);

		return () => clearTimeout(timer);
	});

	async function addFromBook(book: BookSearchResult) {
		addingId = book.googleBooksId;
		error = '';

		try {
			const reading = await createReadingFromBook(book.googleBooksId);
			await refreshStats();
			await goto(`/readings/${reading.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : '追加に失敗しました';
			addingId = null;
		}
	}

	async function addManual() {
		if (!manualTitle.trim() || !manualAuthor.trim()) {
			error = 'タイトルと著者を入力してください';
			return;
		}

		manualSaving = true;
		error = '';

		try {
			const reading = await createReading({
				title: manualTitle.trim(),
				author: manualAuthor.trim()
			});
			await refreshStats();
			await goto(`/readings/${reading.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : '追加に失敗しました';
			manualSaving = false;
		}
	}
</script>

<p><a href="/">← 一覧</a></p>

<h1>本を追加</h1>

<section class="search">
	<label>
		Google Books で検索
		<input type="search" placeholder="タイトルや著者" bind:value={query} />
	</label>

	{#if searching}
		<p>検索中…</p>
	{:else if results.length > 0}
		<ul class="results">
			{#each results as book (book.googleBooksId)}
				<li>
					<button
						type="button"
						class="result"
						onclick={() => addFromBook(book)}
						disabled={addingId !== null || manualSaving}
					>
						{#if book.thumbnailUrl}
							<img src={book.thumbnailUrl} alt="" />
						{/if}
						<div>
							<p class="title">{book.title}</p>
							<p class="author">{book.author}</p>
						</div>
						<span>{addingId === book.googleBooksId ? '追加中…' : '追加'}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="manual">
	<h2>手動で追加</h2>
	<label>
		タイトル
		<input type="text" bind:value={manualTitle} />
	</label>
	<label>
		著者
		<input type="text" bind:value={manualAuthor} />
	</label>
	<button
		type="button"
		onclick={addManual}
		disabled={manualSaving || addingId !== null}
	>
		{manualSaving ? '追加中…' : '手動で追加'}
	</button>
</section>

{#if error}
	<p class="error">{error}</p>
{/if}

<style>
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
	}

	.search,
	.manual {
		display: grid;
		gap: 0.75rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	input {
		padding: 0.5rem 0.75rem;
	}

	.results {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	.result {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 0;
		text-align: left;
	}

	.result img {
		width: 2.5rem;
		height: 3.75rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.title {
		margin: 0;
		font-size: 1rem;
	}

	.author {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
	}

</style>
