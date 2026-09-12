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

<div class="scene">
	<div class="art" aria-hidden="true"></div>
	<div class="veil" aria-hidden="true"></div>
	<div class="content">
		<aside class="sidebar">
			<div class="brand">読書記録</div>
			<nav aria-label="メインメニュー">
				<a class="active" href="/">▣　 本棚</a>
				<a href="/">♡　 読みたい本</a>
				<a href="/">●　 読了</a>
			</nav>
		</aside>
		<section class="panel">
			<div class="search-row">
				<input type="search" placeholder="本を探す…" bind:value={query} aria-label="読書記録を検索" />
				<a class="add" href="/add">＋ 本を追加</a>
			</div>
			<header><p class="eyebrow">LIBRARY OF QUIET MOMENTS</p><h1>本棚</h1></header>
			<div class="section-title"><span>最近の本</span><span class="count">{readings.length}冊</span></div>
			{#if loading}<p class="empty">読み込み中…</p>
			{:else if error}<p class="empty error">{error}</p>
			{:else if readings.length === 0}<p class="empty">読書記録がありません。</p>
			{:else}<ul class="cards">{#each readings as reading (reading.id)}<li><a class="card" href="/readings/{reading.id}">{#if reading.thumbnailUrl}<img src={reading.thumbnailUrl} alt="" />{:else}<div class="cover"></div>{/if}<div><p class="title">{reading.title}</p><p class="author">{reading.author}</p><span class="badge">{statusLabels[reading.status]}</span></div></a></li>{/each}</ul>{/if}
			<p class="stats">読了 <strong>{stats.finished}</strong>　読書中 <strong>{stats.reading}</strong>　積読 <strong>{stats.tsundoku}</strong></p>
		</section>
	</div>
</div>

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
	.scene { position: relative; min-height: 100vh; overflow: hidden; color: #30443a; }
	.art { position: absolute; inset: 0; background: url('/images/library-concept.png') center/cover no-repeat; filter: saturate(.78) brightness(1.07); }
	.veil { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(245,248,239,.1), rgba(247,246,237,.68) 46%, rgba(247,246,237,.88)); }
	.content { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(220px, 27vw) minmax(560px, 1fr); min-height: 100vh; }
	.sidebar { padding: clamp(2rem, 5vw, 5rem) clamp(1.5rem, 4vw, 4rem); }
	.brand { display: inline-block; padding: .7rem 1.2rem; border: 1px solid #a08c58; border-radius: 1rem; background: rgba(250,249,240,.88); font-size: clamp(1.8rem, 3vw, 3rem); letter-spacing: .15em; box-shadow: 0 8px 24px rgba(43,60,44,.2); }
	nav { display: grid; gap: .4rem; margin-top: 4rem; max-width: 13rem; }
	nav a { padding: 1rem; border-radius: .8rem; text-decoration: none; font-size: 1.1rem; background: rgba(247,248,239,.74); }
	nav a.active { background: #fffdf2; box-shadow: 0 8px 20px rgba(50,65,43,.18); }
	.panel { align-self: center; margin: 5vh 5vw 5vh 0; padding: clamp(1.5rem, 3vw, 3rem); border: 1px solid rgba(153,139,91,.7); border-radius: 1.5rem; background: rgba(255,254,247,.9); box-shadow: 0 20px 60px rgba(53,68,48,.28); backdrop-filter: blur(8px); }
	.search-row { display: flex; gap: .75rem; align-items: center; }
	input[type='search'] { flex: 1; width: 100%; padding: .9rem 1.1rem; box-sizing: border-box; border: 1px solid #bcae83; border-radius: 2rem; background: #fffef8; }
	.add { padding: .8rem 1rem; border-radius: 2rem; background: #405c4c; color: #fff; text-decoration: none; white-space: nowrap; }
	header { margin: 2.5rem 0 1.5rem; border-bottom: 1px solid #cfc6a7; }
	.eyebrow { margin: 0; color: #87947d; font: .7rem system-ui, sans-serif; letter-spacing: .16em; }
	h1 { margin: .15rem 0 1rem; font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 500; }
	.section-title { display: flex; justify-content: space-between; font-size: 1.3rem; margin-bottom: 1rem; }
	.count { color: #9a8d6b; font-size: .9rem; }
	.cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1rem; }
	.card { display: flex; gap: .8rem; min-height: 8rem; padding: .8rem; text-decoration: none; border: 1px solid #e0d8be; border-radius: .9rem; background: rgba(255,255,250,.8); transition: transform .2s, box-shadow .2s; }
	.card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(53,68,48,.18); }
	.card img, .cover { width: 4.2rem; height: 6.3rem; object-fit: cover; flex-shrink: 0; border-radius: .35rem; background: linear-gradient(145deg, #6d876f, #d3c995); }
	.title, .author { margin: 0; }.title { font-size: 1.05rem; }.author { margin-top: .35rem; font-size: .85rem; color: #7d857a; }.badge { display: inline-block; margin-top: 1rem; padding: .2rem .5rem; border-radius: 1rem; background: #e6eee2; font-size: .72rem; }
	.stats { margin: 2rem 0 0; color: #788276; font-size: .85rem; }
	.empty { color: #768273; }.error { color: #9b4f45; }
	@media (max-width: 800px) { .content { grid-template-columns: 1fr; }.sidebar { padding-bottom: 1rem; }.brand { font-size: 1.8rem; }.sidebar nav { display: flex; margin-top: 1rem; max-width: none; overflow-x: auto; }.sidebar nav a { white-space: nowrap; padding: .7rem; }.panel { margin: 1rem; }.veil { background: rgba(247,246,237,.8); } }
</style>
