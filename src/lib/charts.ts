const WIDTH = 600;
const HEIGHT = 300;

/** Plugin para forçar fundo branco no canvas (evita quadrado preto no PDF) */
const whiteBackgroundPlugin = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (
    chart: { ctx: CanvasRenderingContext2D; width: number; height: number },
    _args: unknown,
    opts: { color?: string }
  ) => {
    const { ctx } = chart;
    ctx.save();
    ctx.fillStyle = opts?.color ?? "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

type ChartRenderer = {
  renderToBuffer: (config: object, mimeType?: string) => Promise<Buffer>;
};

let chartJSNodeCanvas: ChartRenderer | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ChartJSNodeCanvas } = require("chartjs-node-canvas") as {
    ChartJSNodeCanvas: new (opts: {
      width: number;
      height: number;
      backgroundColour: string;
    }) => ChartRenderer;
  };
  chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: "#ffffff",
  });
} catch {
  chartJSNodeCanvas = null;
}

/** Retorna JPEG 1x1 branco como fallback (evita quadrado preto; JPEG não tem transparência) */
function createSemDadosPlaceholder(): Buffer {
  const base64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQD/AL+gD//Z";
  return Buffer.from(base64, "base64");
}

export async function generateBarChart(options: {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
  }>;
  title?: string;
}): Promise<Buffer> {
  if (!chartJSNodeCanvas) {
    throw new Error(
      "chartjs-node-canvas not available. Install native deps: libcairo2-dev libpango1.0-dev"
    );
  }

  const allData = options.datasets.flatMap((d) => d.data);
  const allZero = allData.length > 0 && allData.every((v) => v === 0);

  const scales: Record<string, unknown> = {
    y: { beginAtZero: true },
  };
  if (allZero) {
    (scales.y as Record<string, unknown>).suggestedMax = 1;
  }

  try {
    const buffer = await chartJSNodeCanvas.renderToBuffer(
      {
        type: "bar",
        data: {
          labels: options.labels,
          datasets: options.datasets.map((ds) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.backgroundColor ?? "rgba(59, 130, 246, 0.8)",
          })),
        },
        options: {
          plugins: {
            customCanvasBackgroundColor: { color: "#ffffff" },
            title: options.title ? { display: true, text: options.title } : undefined,
          },
          scales,
        },
        plugins: [whiteBackgroundPlugin],
      },
      "image/jpeg"
    );

    if (!buffer || buffer.length === 0) {
      return createSemDadosPlaceholder();
    }
    return buffer;
  } catch {
    return createSemDadosPlaceholder();
  }
}
