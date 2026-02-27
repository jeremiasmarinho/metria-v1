export function truncateText(value: string, maxLength = 40): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

type MetricRow = { label: string; value: string | number; variation?: number };

function toSortableNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const normalized = value.replace(/[^\d.,-]/g, "").replace(".", "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function topRowsWithOthers(rows: MetricRow[], limit = 5): MetricRow[] {
  if (rows.length <= limit) return rows;
  const sorted = [...rows].sort((a, b) => toSortableNumber(b.value) - toSortableNumber(a.value));
  const topRows = sorted.slice(0, limit);
  const rest = sorted.slice(limit);

  const othersValue = rest.reduce((sum, row) => sum + toSortableNumber(row.value), 0);
  const withOthers: MetricRow[] = [
    ...topRows,
    {
      label: "Outros",
      value: Number.isInteger(othersValue) ? othersValue : Math.round(othersValue * 100) / 100,
    },
  ];
  return withOthers;
}
