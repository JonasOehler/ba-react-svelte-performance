import { useState } from "react";

interface CellProps {
  value: number;
}

export function Cell({ value }: CellProps) {
  const [clicked, setClicked] = useState(false);
  const hue = value * 1.2; // 0-99 → 0-118.8 (green → red)
  return (
    <div
      className="cell"
      onClick={() => setClicked((c) => !c)}
      style={{
        width: 30,
        height: 30,
        overflow: "hidden",
        backgroundColor: `hsl(${hue}, 80%, 50%)`,
        boxShadow: clicked ? "inset 0 0 0 2px #000" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        color: "#fff",
        fontFamily: "monospace",
        cursor: "pointer",
      }}
    >
      {value}
    </div>
  );
}
