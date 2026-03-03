import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface ChartPlaceholderProps {
  title: string;
}

export function ChartPlaceholder({ title }: ChartPlaceholderProps) {
  return (
    <View
      style={{
        marginBottom: 16,
        padding: 24,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 4,
        minHeight: 150,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ ...styles.sectionTitle, marginBottom: 4 }}>{title}</Text>
      <Text style={{ ...styles.text, color: "#64748b" }}>Sem dados no período</Text>
    </View>
  );
}
