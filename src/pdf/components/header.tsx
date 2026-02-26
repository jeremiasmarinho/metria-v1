import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PdfHeaderProps {
  clientName: string;
  period: string;
}

export function PdfHeader({ clientName, period }: PdfHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Relatório de Marketing</Text>
      <Text style={styles.subtitle}>
        {clientName} · {period}
      </Text>
    </View>
  );
}
