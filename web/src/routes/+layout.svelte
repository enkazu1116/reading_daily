<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { refreshStats } from '$lib/stats';

	let { children } = $props();

	$effect(() => {
		refreshStats();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>読書記録</title>
</svelte:head>

<div class="app-shell">
	<main>{@render children()}</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
		font-size: 1rem;
		line-height: 1.5;
		background: #e8eee7;
	}

	:global(a) {
		color: inherit;
		text-decoration: underline;
	}

	:global(button),
	:global(input),
	:global(select),
	:global(textarea) {
		font: inherit;
	}

	main {
		min-height: 100vh;
	}
</style>
