<script lang="ts">
	import { getReadings, searchReadings } from '$lib/api';
	import { statusLabels } from '$lib/status';
	import { stats } from '$lib/stats';
	import type { Reading } from '$lib/types';

	let query = $state('');
	let readings = $state<Reading[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function loadReadings(searchQuery: string) {
		loading = true;
		error = '';
		try {
			readings = searchQuery.trim()
				? await searchReadings(searchQuery.trim())
				: await getReadings();
		} catch (err) {
			error = err instanceof Error ? err.message : '読み込みに失敗しました';
			readings = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const timer = setTimeout(() => {
			loadReadings(query);
		}, 300);

		return () => clearTimeout(timer);
	});
</script>

<section class="search">
	<input
		type="search"
		placeholder="検索"
		bind:value={query}
		aria-label="読書記録を検索"
	/>
	<p class="stats">
		読了 <strong>{stats.finished}</strong> ・ 読書中 <strong>{stats.reading}</strong> ・ 積読
		<strong>{stats.tsundoku}</strong> ・ 今月 <strong>{stats.pagesThisMonth}</strong> ページ
	</p>
	<p><a href="/add">本を追加</a></p>
</section>

{#if loading}
	<p>読み込み中…</p>
{:else if error}
	<p class="error">{error}</p>
{:else if readings.length === 0}
	<p>読書記録がありません。</p>
{:else}
	<ul class="cards">
		{#each readings as reading (reading.id)}
			<li>
				<a class="card" href="/readings/{reading.id}">
					{#if reading.thumbnailUrl}
						<img src={reading.thumbnailUrl} alt="" />
					{/if}
					<div>
						<p class="title">{reading.title}</p>
						<p class="author">{reading.author}</p>
						<span class="badge">{statusLabels[reading.status]}</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.search {
		display: grid;
		gap: 0.75rem;
	}

	input[type='search'] {
		width: 100%;
		padding: 0.5rem 0.75rem;
		box-sizing: border-box;
	}

	.stats {
		margin: 0;
		font-size: 0.875rem;
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.card {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 0;
		text-decoration: none;
	}

	.card img {
		width: 3rem;
		height: 4.5rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.title {
		margin: 0;
		font-size: 1rem;
	}

	.author {
		margin: 0.25rem 0 0.5rem;
		font-size: 0.875rem;
	}

	.badge {
		font-size: 0.75rem;
	}
</style>
