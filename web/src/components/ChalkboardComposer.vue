<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { slugify } from "../lib/slug";

const props = defineProps<{
  title: string;
  description?: string | null;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const errorMessage = ref<string | null>(null);

const FONT_FAMILY = '"Permanent Marker", "Chalkboard SE", "Comic Sans MS", cursive';
const TEXT_COLOR = "rgb(244 241 234)";
const STROKE_COLOR = "rgba(255, 255, 255, 0.6)";

const loadImage = async () => {
  if (imageRef.value) return imageRef.value;
  const image = new Image();
  image.src = "/images/chalkboard.png";
  await image.decode();
  imageRef.value = image;
  return image;
};

const wrapText = (
  text: string,
  maxWidth: number,
  measure: (value: string) => number
) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (measure(testLine) <= maxWidth) {
      line = testLine;
      continue;
    }

    if (line) {
      lines.push(line);
      line = "";
    }

    if (measure(word) <= maxWidth) {
      line = word;
      continue;
    }

    let chunk = "";
    for (const char of word) {
      const testChunk = chunk + char;
      if (measure(testChunk) <= maxWidth) {
        chunk = testChunk;
      } else {
        if (chunk) lines.push(chunk);
        chunk = char;
      }
    }

    if (chunk) {
      line = chunk;
    }
  }

  if (line) lines.push(line);
  return lines;
};

const formatDescription = (text?: string | null) => {
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return trimmed;
  }
  return `(${trimmed})`;
};

const fitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number
) => {
  let fontSize = Math.round(maxWidth * 0.12);
  const minSize = 18;
  let lines: string[] = [];

  while (fontSize >= minSize) {
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    lines = wrapText(text, maxWidth, (value) => ctx.measureText(value).width);
    const lineHeight = fontSize * 1.2;
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lines, lineHeight };
    }
    fontSize -= 2;
  }

  ctx.font = `${minSize}px ${FONT_FAMILY}`;
  lines = wrapText(text, maxWidth, (value) => ctx.measureText(value).width);
  return { fontSize: minSize, lines, lineHeight: minSize * 1.2 };
};

const layoutText = (
  ctx: CanvasRenderingContext2D,
  title: string,
  description: string,
  maxWidth: number,
  maxHeight: number
) => {
  const subtitleText = formatDescription(description);
  if (!subtitleText) {
    const titleLayout = fitText(ctx, title, maxWidth, maxHeight);
    return {
      title: titleLayout,
      subtitle: null,
      totalHeight: titleLayout.lines.length * titleLayout.lineHeight,
      gap: 0,
    };
  }

  let titleSize = Math.round(maxWidth * 0.12);
  const minTitle = 20;
  const minSubtitle = 12;

  while (titleSize >= minTitle) {
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;
    const titleLines = wrapText(
      title,
      maxWidth,
      (value) => ctx.measureText(value).width
    );
    const titleLineHeight = titleSize * 1.2;
    const titleHeight = titleLines.length * titleLineHeight;

    let subtitleSize = Math.max(Math.round(titleSize * 0.55), minSubtitle);
    let subtitleLines: string[] = [];
    let subtitleLineHeight = subtitleSize * 1.2;
    let subtitleHeight = 0;
    const gap = Math.max(8, Math.round(titleSize * 0.35));

    while (subtitleSize >= minSubtitle) {
      ctx.font = `${subtitleSize}px ${FONT_FAMILY}`;
      subtitleLines = wrapText(
        subtitleText,
        maxWidth * 0.92,
        (value) => ctx.measureText(value).width
      );
      subtitleLineHeight = subtitleSize * 1.2;
      subtitleHeight = subtitleLines.length * subtitleLineHeight;

      if (titleHeight + gap + subtitleHeight <= maxHeight) {
        return {
          title: {
            fontSize: titleSize,
            lines: titleLines,
            lineHeight: titleLineHeight,
          },
          subtitle: {
            fontSize: subtitleSize,
            lines: subtitleLines,
            lineHeight: subtitleLineHeight,
          },
          totalHeight: titleHeight + gap + subtitleHeight,
          gap,
        };
      }
      subtitleSize -= 2;
    }

    titleSize -= 2;
  }

  const fallbackTitle = fitText(ctx, title, maxWidth, maxHeight);
  return {
    title: fallbackTitle,
    subtitle: null,
    totalHeight: fallbackTitle.lines.length * fallbackTitle.lineHeight,
    gap: 0,
  };
};

const render = async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const text = props.title?.trim() || "Burger of the Day";
  const description = props.description?.trim() || "";

  try {
    const image = await loadImage();
    if (document.fonts) {
      await document.fonts.load(`48px ${FONT_FAMILY}`);
      await document.fonts.ready;
    }

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const paddingX = width * 0.12;
    const paddingTop = height * 0.27;
    const paddingBottom = height * 0.12;

    const textWidth = width - paddingX * 2;
    const textHeight = height - paddingTop - paddingBottom;

    const layout = layoutText(ctx, text, description, textWidth, textHeight);

    const startY =
      paddingTop + (textHeight - layout.totalHeight) / 2 + layout.title.fontSize;

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = TEXT_COLOR;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
    ctx.shadowBlur = Math.round(layout.title.fontSize * 0.08);

    ctx.font = `${layout.title.fontSize}px ${FONT_FAMILY}`;
    ctx.lineWidth = Math.max(2, Math.round(layout.title.fontSize * 0.08));

    layout.title.lines.forEach((line, index) => {
      const y = startY + index * layout.title.lineHeight;
      ctx.strokeText(line, width / 2, y);
      ctx.fillText(line, width / 2, y);
    });

    if (layout.subtitle) {
      ctx.font = `${layout.subtitle.fontSize}px ${FONT_FAMILY}`;
      ctx.lineWidth = Math.max(1, Math.round(layout.subtitle.fontSize * 0.06));
      ctx.shadowBlur = Math.round(layout.subtitle.fontSize * 0.05);

      const subtitleStartY =
        startY +
        layout.title.lines.length * layout.title.lineHeight +
        layout.gap;

      layout.subtitle.lines.forEach((line, index) => {
        const y = subtitleStartY + index * layout.subtitle.lineHeight;
        ctx.strokeText(line, width / 2, y);
        ctx.fillText(line, width / 2, y);
      });
    }

    errorMessage.value = null;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to render chalkboard.";
  }
};

const downloadImage = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `${slugify(props.title || "burger")}-chalkboard.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

onMounted(() => {
  render();
});

watch(
  () => [props.title, props.description],
  () => {
    render();
  }
);
</script>

<template>
  <div class="glass-card p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-text/60">
          Chalkboard capture
        </p>
        <h2 class="mt-2 text-2xl font-semibold">Download the chalkboard</h2>
        <p class="mt-2 text-sm text-text/70">
          Grab a shareable image with the burger title on the board.
        </p>
      </div>
      <button class="button-base" type="button" @click="downloadImage">
        Download PNG
      </button>
    </div>

    <div class="mt-6 flex justify-center">
      <div class="w-full max-w-sm rounded-3xl border border-white/10 bg-muted/40 p-4">
        <canvas
          ref="canvasRef"
          class="w-full h-auto"
          role="img"
          :aria-label="`Chalkboard render for ${props.title}`"
        ></canvas>
        <p v-if="errorMessage" class="mt-3 text-sm text-text/60">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
