<script lang="ts">
	import type { Reading, ReadingStatus } from '$lib/api/types';
	import { readingDetail } from '$lib/stores/reading-detail.svelte';
	import { statusLabels } from '$lib/utils/status';

	const statuses: ReadingStatus[] = ['reading', 'finished', 'tsundoku'];

	let {
		reading,
		onsave,
		ondelete
	}: {
		reading: Reading;
		onsave: () => void;
		ondelete: () => void;
	} = $props();
</script>

<section class="stack stack--loose">
	<h1 class="page-title">{reading.title}</h1>
	<p class="reading-detail__author">{reading.author}</p>

	<label class="field">
		ステータス
		<select class="input" bind:value={readingDetail.status}>
			{#each statuses as value}
				<option {value}>{statusLabels[value]}</option>
			{/each}
		</select>
	</label>

	<label class="field">
		現在のページ
		<input class="input" type="number" min="0" bind:value={readingDetail.currentPage} />
	</label>

	<label class="field">
		総ページ数
		<input
			class="input"
			type="number"
			min="0"
			bind:value={readingDetail.totalPages}
			placeholder="未設定"
		/>
	</label>

	<label class="field">
		メモ
		<textarea class="input" rows="6" bind:value={readingDetail.memo}></textarea>
	</label>

	{#if readingDetail.error}
		<p class="error-message">{readingDetail.error}</p>
	{/if}

	<div class="actions">
		<button
			class="button"
			type="button"
			onclick={onsave}
			disabled={readingDetail.saving || readingDetail.deleting}
		>
			{readingDetail.saving ? '保存中…' : '保存'}
		</button>
		<button
			class="button"
			type="button"
			onclick={ondelete}
			disabled={readingDetail.saving || readingDetail.deleting}
		>
			{readingDetail.deleting ? '削除中…' : '削除'}
		</button>
	</div>
</section>
