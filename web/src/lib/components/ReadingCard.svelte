<script lang="ts">
	import type { Reading } from '$lib/api/types';
	import StatusBadge from './StatusBadge.svelte';

	let { reading }: { reading: Reading } = $props();
</script>

<a class="library-card" href="/readings/{reading.id}">
	{#if reading.thumbnailUrl}
		<img class="library-card__cover" src={reading.thumbnailUrl} alt="" />
	{:else}
		<div class="library-card__cover library-card__cover--placeholder"></div>
	{/if}
	<div>
		<p class="library-card__title">{reading.title}</p>
		<p class="library-card__author">{reading.author}</p>
		<StatusBadge status={reading.status} />
	</div>
</a>
