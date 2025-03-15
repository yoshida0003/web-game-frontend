import { useDrop } from "react-dnd";
import Piece from "./piece";

interface SquareProps {
  x: number;
  y: number;
  piece: string | null;
  isFirstPlayer: boolean;
  movePiece: (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => Promise<void>;
}

const Square: React.FC<SquareProps> = ({
  x,
  y,
  piece,
  isFirstPlayer,
  movePiece,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: "PIECE",
    drop: async (item: {
      x: number;
      y: number;
      piece: string;
      fromCaptured: boolean;
      capturedIndex?: number;
      playerSide: "first" | "second"; // ✅ 駒の所有者情報を保持
    }) => {
      let { x: fromX, y: fromY } = item;
      const { fromCaptured, capturedIndex, playerSide } = item;
      let targetX = x;
      let targetY = y;

      if (fromCaptured) {
        fromX = playerSide === "first" ? 9 : 10; // ✅ 所有者に基づいて処理
        fromY = capturedIndex ?? -1;
      } else if (!isFirstPlayer) {
        fromX = 8 - fromX;
        fromY = 8 - fromY;
        targetX = 8 - x;
        targetY = 8 - y;
      }

      console.log(`🎯 ドロップ: (${fromX},${fromY}) → (${targetX},${targetY})`);
      await movePiece(fromX, fromY, targetX, targetY);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`flex items-center justify-center border border-gray-700 w-16 h-16 ${
        isOver ? "bg-blue-300" : ""
      }`}
    >
      {piece && (
        <Piece
          piece={piece}
          x={x}
          y={y}
          isFirstPlayer={isFirstPlayer}
          playerSide={piece === piece.toUpperCase() ? "first" : "second"} // ✅ 所有者情報を正しく渡す
          fromCaptured={false} // ✅ 盤面上の駒
        />
      )}
    </div>
  );
};

export default Square;
