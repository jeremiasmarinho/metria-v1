import React from "react";
import { View, Image } from "@react-pdf/renderer";

interface ChartImageProps {
  src: string;
  width?: number;
  height?: number;
}

export function ChartImage({ src, width = 500, height = 250 }: ChartImageProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Image
        src={src}
        style={{
          width: Number(width),
          height: Number(height),
        }}
      />
    </View>
  );
}
