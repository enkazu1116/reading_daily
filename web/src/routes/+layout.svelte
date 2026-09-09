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

<div class="app">
	<header>
		<a href="/">読書記録</a>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		font-size: 1rem;
		line-height: 1.5;
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

	.app {
		max-width: 40rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}

	header {
		margin-bottom: 2rem;
		font-size: 1.25rem;
	}

	header a {
		text-decoration: none;
		font-size: 1.25rem;
	}

	main {
		display: grid;
		gap: 1.5rem;
	}
</style>
