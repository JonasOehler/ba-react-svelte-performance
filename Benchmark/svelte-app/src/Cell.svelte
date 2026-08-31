<script lang="ts">
  let { value }: { value: number } = $props();
  let clicked = $state(false);
</script>

<div
  class="cell"
  onclick={() => { clicked = !clicked; }}
  style="
    width: 30px;
    height: 30px;
    overflow: hidden;
    background-color: hsl({value * 1.2}, 80%, 50%);
    box-shadow: {clicked ? 'inset 0 0 0 2px #000' : 'none'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #fff;
    font-family: monospace;
    cursor: pointer;
  "
>
  {value}
</div>
