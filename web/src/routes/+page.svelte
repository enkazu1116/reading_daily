<script lang="ts">
	import HomeSearchPanel from '$lib/components/HomeSearchPanel.svelte';
	import ReadingCardList from '$lib/components/ReadingCardList.svelte';
	import { loadReadings, readingsList } from '$lib/stores/readings-list.svelte';

	$effect(() => {
		const timer = setTimeout(() => {
			loadReadings(readingsList.query);
		}, 300);

		return () => clearTimeout(timer);
	});
</script>

<HomeSearchPanel />

{#if readingsList.loading}
	<p>読み込み中…</p>
{:else if readingsList.error}
	<p>{readingsList.error}</p>
{:else if readingsList.readings.length === 0}
	<p>読書記録がありません。</p>
{:else}
	<ReadingCardList readings={readingsList.readings} />
{/if}
