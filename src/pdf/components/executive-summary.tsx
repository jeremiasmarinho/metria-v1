import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface ExecutiveSummaryProps {
  content: string;
}

export function ExecutiveSummary({ content }: ExecutiveSummaryProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Análise Executiva</Text>
      <Text style={styles.text}>{content}</Text>
    </View>
  );
}
