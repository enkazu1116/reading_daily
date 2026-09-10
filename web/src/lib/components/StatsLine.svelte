<script lang="ts">
	import { stats } from '$lib/stores/stats.svelte';
</script>

<p class="stats-line">
	読了 <strong>{stats.finished}</strong> ・ 読書中 <strong>{stats.reading}</strong> ・ 積読
	<strong>{stats.tsundoku}</strong> ・ 今月 <strong>{stats.pagesThisMonth}</strong> ページ
</p>
