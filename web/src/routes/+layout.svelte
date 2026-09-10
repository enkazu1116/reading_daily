<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { refreshStats } from '$lib/stores/stats.svelte';

	let { children } = $props();

	$effect(() => {
		refreshStats();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>読書記録</title>
</svelte:head>

<div class="app">
	<header class="app-header">
		<a class="app-header__link" href="/">読書記録</a>
	</header>
	<main class="app-main">
		{@render children()}
	</main>
</div>
