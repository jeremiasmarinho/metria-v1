const WIDTH = 600;
const HEIGHT = 300;

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
    backgroundColour: "white",
  });
} catch {
  chartJSNodeCanvas = null;
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

  return chartJSNodeCanvas.renderToBuffer({
    type: "bar",
    data: {
      labels: options.labels,
      datasets: options.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor ?? "rgba(59, 130, 246, 0.7)",
      })),
    },
    options: {
      plugins: {
        title: options.title ? { display: true, text: options.title } : undefined,
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}
