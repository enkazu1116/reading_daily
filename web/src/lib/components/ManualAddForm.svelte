<script lang="ts">
	import { bookSearch } from '$lib/stores/book-search.svelte';

	let {
		onsubmit
	}: {
		onsubmit: () => void;
	} = $props();
</script>

<section class="stack">
	<h2 class="section-title">手動で追加</h2>
	<label class="field">
		タイトル
		<input class="input" type="text" bind:value={bookSearch.manualTitle} />
	</label>
	<label class="field">
		著者
		<input class="input" type="text" bind:value={bookSearch.manualAuthor} />
	</label>
	<button
		class="button"
		type="button"
		onclick={onsubmit}
		disabled={bookSearch.manualSaving || bookSearch.addingId !== null}
	>
		{bookSearch.manualSaving ? '追加中…' : '手動で追加'}
	</button>
</section>
