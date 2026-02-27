import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { truncateText, topRowsWithOthers } from "../utils";

interface MetricsTableProps {
  rows: Array<{ label: string; value: string | number; variation?: number }>;
}

export function MetricsTable({ rows }: MetricsTableProps) {
  const safeRows = topRowsWithOthers(rows, 5).map((row) => ({
    ...row,
    label: truncateText(row.label, 40),
  }));

  if (safeRows.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métricas Consolidadas</Text>
        <Text style={styles.text}>Sem dados registrados para este período.</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Métrica</Text>
        <Text style={styles.tableCell}>Valor</Text>
        <Text style={styles.tableCell}>Variação</Text>
      </View>
      {safeRows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>{row.label}</Text>
          <Text style={styles.tableCell}>{row.value}</Text>
          <Text style={styles.tableCell}>
            {row.variation != null ? `${row.variation > 0 ? "+" : ""}${row.variation}%` : "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}
