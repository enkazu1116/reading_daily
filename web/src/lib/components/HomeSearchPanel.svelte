<script lang="ts">
	import { readingsList } from '$lib/stores/readings-list.svelte';
	import StatsLine from './StatsLine.svelte';
</script>

<section class="stack">
	<input
		class="input input--search"
		type="search"
		placeholder="検索"
		bind:value={readingsList.query}
		aria-label="読書記録を検索"
	/>
	<StatsLine />
	<p><a href="/add">本を追加</a></p>
</section>
