<script lang="ts">
	import { readingsList } from '$lib/stores/readings-list.svelte';
	import StatsLine from './StatsLine.svelte';
</script>

<div class="library-search-row">
	<input
		class="library-search-input"
		type="search"
		placeholder="本を探す…"
		bind:value={readingsList.query}
		aria-label="読書記録を検索"
	/>
	<a class="library-add-link" href="/add">＋ 本を追加</a>
</div>
<StatsLine />
