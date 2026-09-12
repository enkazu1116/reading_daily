<script lang="ts">
	import HomeSearchPanel from '$lib/components/HomeSearchPanel.svelte';
	import LibraryScene from '$lib/components/LibraryScene.svelte';
	import ReadingCardList from '$lib/components/ReadingCardList.svelte';
	import { loadReadings, readingsList } from '$lib/stores/readings-list.svelte';

	$effect(() => {
		const timer = setTimeout(() => {
			loadReadings(readingsList.query);
		}, 300);

		return () => clearTimeout(timer);
	});
</script>

<LibraryScene>
	<HomeSearchPanel />

	<header class="library-panel__header">
		<p class="library-panel__eyebrow">LIBRARY OF QUIET MOMENTS</p>
		<h1 class="library-panel__title">本棚</h1>
	</header>

	<div class="library-panel__section-title">
		<span>最近の本</span>
		<span class="library-panel__count">{readingsList.readings.length}冊</span>
	</div>

	{#if readingsList.loading}
		<p class="library-empty">読み込み中…</p>
	{:else if readingsList.error}
		<p class="library-empty library-empty--error">{readingsList.error}</p>
	{:else if readingsList.readings.length === 0}
		<p class="library-empty">読書記録がありません。</p>
	{:else}
		<ReadingCardList readings={readingsList.readings} />
	{/if}
</LibraryScene>
