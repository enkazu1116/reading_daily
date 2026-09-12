<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="library-scene">
	<div class="library-scene__art" aria-hidden="true"></div>
	<div class="library-scene__veil" aria-hidden="true"></div>
	<div class="library-scene__content">
		<aside class="library-sidebar">
			<a class="library-brand" href="/">読書記録</a>
			<nav class="library-nav" aria-label="メインメニュー">
				<a class="library-nav__item library-nav__item--active" href="/">▣　 本棚</a>
				<!-- Decorative labels only; no filter routes — status shown on cards -->
				<span class="library-nav__item" aria-hidden="true">♡　 読みたい本</span>
				<span class="library-nav__item" aria-hidden="true">●　 読了</span>
			</nav>
		</aside>
		<section class="library-panel">
			{@render children()}
		</section>
	</div>
</div>
