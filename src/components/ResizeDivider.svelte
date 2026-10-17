<script lang="ts">
  interface Props {
    currentHeight: number;
    minHeight?: number;
    maxHeightFraction?: number;
    onHeightChange: (height: number) => void;
  }

  let {
    currentHeight,
    minHeight = 60,
    maxHeightFraction = 0.75,
    onHeightChange,
  }: Props = $props();

  let isDragging = $state(false);
  let dragStartY = 0;
  let dragStartHeight = 0;

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartHeight = currentHeight;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY;
    const clamped = Math.max(
      minHeight,
      Math.min(dragStartHeight + delta, window.innerHeight * maxHeightFraction)
    );
    onHeightChange(clamped);
  }

  function onMouseUp() {
    isDragging = false;
  }
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="resize-divider"
  class:dragging={isDragging}
  role="separator"
  aria-orientation="horizontal"
  onmousedown={onMouseDown}
>
  <span class="resize-dots"></span>
</div>

<style>
  .resize-divider {
    flex-shrink: 0;
    height: var(--spacer-05);
    background-color: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    cursor: row-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .resize-divider:hover,
  .resize-divider.dragging {
    background-color: var(--border-color);
  }

  .resize-dots {
    width: 24px;
    height: 3px;
    border-top: 1px solid var(--text-secondary);
    border-bottom: 1px solid var(--text-secondary);
    opacity: 0.4;
  }
</style>
