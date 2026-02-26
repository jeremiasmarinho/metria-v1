import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface MetricsTableProps {
  rows: Array<{ label: string; value: string | number; variation?: number }>;
}

export function MetricsTable({ rows }: MetricsTableProps) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Métrica</Text>
        <Text style={styles.tableCell}>Valor</Text>
        <Text style={styles.tableCell}>Variação</Text>
      </View>
      {rows.map((row, i) => (
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
