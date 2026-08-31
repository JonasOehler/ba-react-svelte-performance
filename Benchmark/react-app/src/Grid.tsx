import type { GridItem } from "@benchmark/shared-logic";
import { Cell } from "./Cell";

interface GridProps {
  items: GridItem[];
}

export function Grid({ items }: GridProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: 900, // 30 columns × 30px
        lineHeight: 0,
      }}
    >
      {items.map((item) => (
        <Cell key={item.id} value={item.value} />
      ))}
    </div>
  );
}
