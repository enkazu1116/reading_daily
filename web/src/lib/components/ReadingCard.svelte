<script lang="ts">
	import type { Reading } from '$lib/api/types';
	import StatusBadge from './StatusBadge.svelte';

	let { reading }: { reading: Reading } = $props();
</script>

<a class="reading-card" href="/readings/{reading.id}">
	{#if reading.thumbnailUrl}
		<img class="reading-card__thumbnail" src={reading.thumbnailUrl} alt="" />
	{/if}
	<div>
		<p class="reading-card__title">{reading.title}</p>
		<p class="reading-card__author">{reading.author}</p>
		<StatusBadge status={reading.status} />
	</div>
</a>
