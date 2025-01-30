import axios from "axios";
import { JSX } from "react";

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
  interface ClickCellPayload {
    roomId: string;
    userId: string;
    x: number;
    y: number;
  }

  const handleClick = async (x: number, y: number): Promise<void> => {
    if (currentPlayer !== userId) {
      alert("相手のターンです！");
      return;
    }

    const payload: ClickCellPayload = {
      roomId,
      userId,
      x,
      y,
    };

    try {
      await axios.post(`http://localhost:3001/api/shogi/click-cell`, payload);
    } catch (error) {
      console.error("Error clicking cell:", error);
    }
  };

  const firstRow = ["9", "8", "7", "6", "5", "4", "3", "2", "1"];
  const firstCol = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const secondRow = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const secondCol = ["九", "八", "七", "六", "五", "四", "三", "二", "一"];

  const rowLabels = isFirstPlayer ? firstRow : secondRow;
  const colLabels = isFirstPlayer ? firstCol : secondCol;

  // 後手なら盤面を反転
  const displayedBoard = isFirstPlayer ? board : [...board].reverse();

  const renderPiece = (cell: string | null): JSX.Element | null => {
    if (!cell) return null;

    const pieceMap: { [key: string]: string } = {
      P: "先歩",
      p: "後歩",
      L: "先香",
      l: "後香",
      N: "先桂",
      n: "後桂",
      S: "先銀",
      s: "後銀",
      G: "先金",
      g: "後金",
      B: "先角",
      b: "後角",
      R: "先飛",
      r: "後飛",
      K: "先王",
      k: "後玉",
    };

    return (
      <span
        className={cell === cell.toUpperCase() ? "text-black" : "text-red-500"}
      >
        {pieceMap[cell] || cell}
      </span>
    );
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        <div>
          <div className="flex">
            {rowLabels.map((rowNam, index) => (
              <div
                key={`row-${index}`}
                className="w-16 h-16 flex items-center justify-center"
              >
                {rowNam}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-9 border border-gray-700"
            style={{
              backgroundColor: "#F9C270",
              width: "36rem", // 全体の幅を指定（9×4rem = 36rem）
              height: "36rem", // 高さも同じにする
            }}
          >
            {displayedBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="flex items-center justify-center border border-gray-700 cursor-pointer w-full h-full"
                  onClick={() => handleClick(rowIndex, colIndex)}
                >
                  {renderPiece(cell)}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-col mt-16">
          {colLabels.map((ColNum, index) => (
            <div
              key={`col-${index}`}
              className="w-16 h-16 flex items-center justify-center"
            >
              {ColNum}
            </div>
          ))}
        </div>
      </div>
      <div className="ml-4">
        <h3 className="mt-4">
          {currentPlayer === userId ? "あなたのターンです" : "相手のターンです"}
        </h3>
        <h3>ログ</h3>
        <ul>
          {logs.map((log, index) => (
            <li key={`${log}-${index}`}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GamePage;