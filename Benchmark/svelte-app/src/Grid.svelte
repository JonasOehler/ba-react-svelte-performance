<script lang="ts">
  import type { GridItem } from '@benchmark/shared-logic';
  import Cell from './Cell.svelte';

  let { items }: { items: GridItem[] } = $props();
</script>

<div style="display: flex; flex-wrap: wrap; width: 900px; line-height: 0">
  {#each items as item (item.id)}
    <Cell value={item.value} />
  {/each}
</div>
