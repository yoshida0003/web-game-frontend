import { useState } from "react";
import axios from "axios";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface GamePageProps {
  board: (string | null)[][];
  roomId: string;
  userId: string;
  isFirstPlayer: boolean;
  logs: string[];
  currentPlayer: string | null;
}

const GamePage: React.FC<GamePageProps> = ({
  board,
  roomId,
  userId,
  isFirstPlayer,
  logs,
  currentPlayer,
}) => {
  // 駒の座標を将棋の座標（4五など）に変換
  const getPositionNotation = (x: number, y: number): string => {
    const cols = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    return `${9 - y}${cols[x]}`;
  };
  

  // 駒の移動リクエスト
  const movePiece = async (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    if (currentPlayer !== userId) {
      alert("相手のターンです！");
      return;
    }

    const notation = getPositionNotation(toX, toY);

    try {
      await axios.post(`http://localhost:3001/api/shogi/move-piece`, {
        roomId,
        userId,
        fromX,
        fromY,
        toX,
        toY,
        notation,
      });
    } catch (error) {
      console.error("Error moving piece:", error);
    }
  };
  

  // 駒のコンポーネント
  const Piece: React.FC<{ piece: string; x: number; y: number }> = ({
    piece,
    x,
    y,
  }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "PIECE",
      item: { x, y, piece },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    return (
      <div
        ref={drag as unknown as React.Ref<HTMLDivElement>}
        className={`cursor-grab ${isDragging ? "opacity-50" : ""}`}
      >
        <span className={piece === "P" ? "text-black" : "text-red-500"}>
          {piece === "P" ? "先歩" : "後歩"}
        </span>
      </div>
    );
  };

  // マスのコンポーネント
  const Square: React.FC<{ x: number; y: number; piece: string | null }> = ({
    x,
    y,
    piece,
  }) => {
    const [{ isOver }, drop] = useDrop({
      accept: "PIECE",
      drop: (item: { x: number; y: number; piece: string }) => {
        const { x: fromX, y: fromY, piece } = item;
        const forwardX = isFirstPlayer ? fromX - 1 : fromX + 1;

        if (x === forwardX && y === fromY) {
          movePiece(fromX, fromY, x, y);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    });
    

    return (
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className={`flex items-center justify-center border border-gray-700 w-full h-full ${
          isOver ? "bg-blue-300" : ""
        }`}
      >
        {piece && <Piece piece={piece} x={x} y={y} />}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex items-center">
        <div>
          <div
            className="grid grid-cols-9 border border-gray-700"
            style={{
              backgroundColor: "#F9C270",
              width: "36rem",
              height: "36rem",
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Square
                  key={`${rowIndex}-${colIndex}`}
                  x={rowIndex}
                  y={colIndex}
                  piece={cell}
                />
              ))
            )}
          </div>
        </div>

        {/* ログエリア */}
        <div className="ml-4">
          <h3 className="mt-4">
            {currentPlayer === userId
              ? "あなたのターンです"
              : "相手のターンです"}
          </h3>
          <h3>ログ</h3>
          <ul>
            {logs.map((log, index) => (
              <li key={`${log}-${index}`}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </DndProvider>
  );
};

export default GamePage;
