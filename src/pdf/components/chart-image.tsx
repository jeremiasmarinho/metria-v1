import { View, Image } from "@react-pdf/renderer";

interface ChartImageProps {
  src: string;
  width?: number;
  height?: number;
}

export function ChartImage({ src, width = 400, height = 200 }: ChartImageProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Image src={src} style={{ width, height }} />
    </View>
  );
}
