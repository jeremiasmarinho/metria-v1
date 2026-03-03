import React from "react";
import { View, Text } from "@react-pdf/renderer";

interface PdfBarChartProps {
  title: string;
  labels: string[];
  data: number[];
  maxBarWidth?: number;
}

export function PdfBarChart({
  title,
  labels,
  data,
  maxBarWidth = 200,
}: PdfBarChartProps) {
  const max = Math.max(...data, 1);

  return (
    <View
      style={{
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {labels.map((label, i) => {
        const value = data[i] ?? 0;
        const barWidth = max > 0 ? (value / max) * maxBarWidth : 0;
        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                width: 80,
                flexShrink: 0,
              }}
            >
              {label}
            </Text>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: barWidth,
                  height: 14,
                  backgroundColor: "#3b82f6",
                  borderRadius: 2,
                }}
              />
              <Text
                style={{
                  fontSize: 9,
                  marginLeft: 6,
                  color: "#475569",
                }}
              >
                {value.toLocaleString("pt-BR")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
