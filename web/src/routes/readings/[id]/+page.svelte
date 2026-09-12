<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BackLink from '$lib/components/BackLink.svelte';
	import ReadingEditForm from '$lib/components/ReadingEditForm.svelte';
	import {
		loadReading,
		readingDetail,
		removeReading,
		saveReading
	} from '$lib/stores/reading-detail.svelte';

	$effect(() => {
		loadReading(page.params.id);
	});

	async function handleDelete() {
		if (!confirm('この読書記録を削除しますか？')) return;

		try {
			await removeReading();
			await goto('/');
		} catch {
			// error is stored in readingDetail.error
		}
	}
</script>

<div class="page">
	<BackLink />

	{#if readingDetail.loading}
		<p>読み込み中…</p>
	{:else if !readingDetail.reading}
		<p class="error-message">{readingDetail.error || '読書記録が見つかりません。'}</p>
	{:else}
		<ReadingEditForm
			reading={readingDetail.reading}
			onsave={saveReading}
			ondelete={handleDelete}
		/>
	{/if}
</div>
