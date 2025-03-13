import React from "react";
import Piece from "./piece";

interface CapturedPiecesProps {
  capturedPieces: { piece: string; owner: "first" | "second" }[];
  isFirstPlayer: boolean;
  playerSide: "first" | "second";
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  capturedPieces,
  isFirstPlayer,
  playerSide,
}) => {
  // 駒の数をカウント
  const pieceCount = capturedPieces.reduce((acc, { piece }) => {
    acc[piece] = (acc[piece] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 重複を排除した駒のリスト
  const uniquePieces = capturedPieces.reduce((acc, { piece, owner }) => {
    if (!acc.some((p) => p.piece === piece)) {
      acc.push({ piece, owner });
    }
    return acc;
  }, [] as { piece: string; owner: "first" | "second" }[]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {uniquePieces.map(({ piece, owner }, index) => {
        const isOwner = isFirstPlayer === (owner === "first"); // ✅ 自分の駒台かどうか

        return (
          <div
            key={`${owner}-${index}`}
            className={`relative w-8 h-8 flex items-center justify-center border border-gray-700 ${
              owner === "first" ? "bg-blue-200" : "bg-red-200"
            }`}
          >
            <Piece
              piece={piece}
              x={0}
              y={0}
              isFirstPlayer={isFirstPlayer}
              fromCaptured={true}
              capturedIndex={capturedPieces.findIndex(
                (p) => p.piece === piece && p.owner === owner
              )} // ✅ 最初に見つかった駒のインデックスを使用
              isOwner={isOwner} // ✅ 自分の駒台の駒かどうか
              playerSide={owner} // ✅ 駒の所有者
            />
            {pieceCount[piece] > 1 && (
              <span className="absolute top-0 right-0 text-xs">
                {pieceCount[piece]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CapturedPieces;
