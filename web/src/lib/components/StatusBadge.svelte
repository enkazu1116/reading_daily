<script lang="ts">
	import type { ReadingStatus } from '$lib/api/types';
	import { statusLabels } from '$lib/utils/status';

	let { status }: { status: ReadingStatus } = $props();
</script>

<span class="status-badge">{statusLabels[status]}</span>
