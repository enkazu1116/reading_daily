<script lang="ts">
	import type { Reading } from '$lib/api/types';
	import ReadingCard from './ReadingCard.svelte';

	let { readings }: { readings: Reading[] } = $props();
</script>

<ul class="card-list">
	{#each readings as reading (reading.id)}
		<li>
			<ReadingCard {reading} />
		</li>
	{/each}
</ul>
