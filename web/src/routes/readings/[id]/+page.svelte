<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { deleteReading, getReading, updateReading } from '$lib/api';
	import { refreshStats } from '$lib/stats';
	import { statusLabels } from '$lib/status';
	import type { Reading, ReadingStatus } from '$lib/types';

	const statuses: ReadingStatus[] = ['reading', 'finished', 'tsundoku'];

	let reading = $state<Reading | null>(null);
	let status = $state<ReadingStatus>('reading');
	let currentPage = $state(0);
	let totalPages = $state('');
	let memo = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let error = $state('');

	$effect(() => {
		const id = page.params.id;
		loading = true;
		error = '';

		getReading(id)
			.then((data) => {
				reading = data;
				status = data.status;
				currentPage = data.currentPage;
				totalPages = data.totalPages?.toString() ?? '';
				memo = data.memo ?? '';
			})
			.catch((err) => {
				error = err instanceof Error ? err.message : '読み込みに失敗しました';
			})
			.finally(() => {
				loading = false;
			});
	});

	async function save() {
		if (!reading) return;

		saving = true;
		error = '';

		try {
			const updated = await updateReading(reading.id, {
				status,
				currentPage,
				totalPages: totalPages.trim() ? Number(totalPages) : null,
				memo
			});
			reading = updated;
			await refreshStats();
		} catch (err) {
			error = err instanceof Error ? err.message : '保存に失敗しました';
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!reading || !confirm('この読書記録を削除しますか？')) return;

		deleting = true;
		error = '';

		try {
			await deleteReading(reading.id);
			await refreshStats();
			await goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : '削除に失敗しました';
			deleting = false;
		}
	}
</script>

<p><a href="/">← 一覧</a></p>

{#if loading}
	<p>読み込み中…</p>
{:else if !reading}
	<p class="error">{error || '読書記録が見つかりません。'}</p>
{:else}
	<section class="detail">
		<h1>{reading.title}</h1>
		<p class="author">{reading.author}</p>

		<label>
			ステータス
			<select bind:value={status}>
				{#each statuses as value}
					<option {value}>{statusLabels[value]}</option>
				{/each}
			</select>
		</label>

		<label>
			現在のページ
			<input type="number" min="0" bind:value={currentPage} />
		</label>

		<label>
			総ページ数
			<input type="number" min="0" bind:value={totalPages} placeholder="未設定" />
		</label>

		<label>
			メモ
			<textarea rows="6" bind:value={memo}></textarea>
		</label>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="actions">
			<button type="button" onclick={save} disabled={saving || deleting}>
				{saving ? '保存中…' : '保存'}
			</button>
			<button type="button" onclick={remove} disabled={saving || deleting}>
				{deleting ? '削除中…' : '削除'}
			</button>
		</div>
	</section>
{/if}

<style>
	.detail {
		display: grid;
		gap: 1rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.author {
		margin: 0;
		font-size: 0.875rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	input,
	select,
	textarea {
		padding: 0.5rem 0.75rem;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
	}

	button {
		padding: 0.5rem 1rem;
	}

</style>
