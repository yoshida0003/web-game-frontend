import { useState, useEffect } from "react";
import axios from "axios";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import io from "socket.io-client";
import PromoteModal from "./promoteModal";

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

interface GamePageProps {
  board: (string | null)[][];
  roomId: string;
  userId: string;
  isFirstPlayer: boolean;
  logs: string[];
  currentPlayer: string | null;
}

const GamePage: React.FC<GamePageProps> = ({
  board: initialBoard,
  roomId,
  userId,
  isFirstPlayer,
  logs: initialLogs,
  currentPlayer: initialCurrentPlayer,
}) => {
  const [board, setBoard] = useState(initialBoard);
  const [logs, setLogs] = useState(initialLogs);
  const [currentPlayer, setCurrentPlayer] = useState(initialCurrentPlayer);
  const [capturedPieces, setCapturedPieces] = useState<{
    firstPlayer: string[];
    secondPlayer: string[];
  }>({ firstPlayer: [], secondPlayer: [] }); // 駒台
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteMove, setPromoteMove] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  
  // 盤面のラベル（先手・後手で異なる）
  const rowLabels = isFirstPlayer
    ? ["一", "二", "三", "四", "五", "六", "七", "八", "九"]
    : ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
  const colLabels = isFirstPlayer
    ? ["9", "8", "7", "6", "5", "4", "3", "2", "1"]
    : ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  // クライアント側で盤面を更新
  useEffect(() => {
    socket.on(
      "update-board",
      ({ board, currentPlayer, logs, capturedPieces }) => {
        console.log("📥 クライアントが update-board を受信: ", {
          board,
          currentPlayer,
          logs,
          capturedPieces,
        });

        setBoard([...board]);
        setCurrentPlayer(currentPlayer);
        setLogs([...logs]);
        setCapturedPieces(capturedPieces);
      }
    );

    return () => {
      socket.off("update-board");
    };
  }, [socket]);

  // 成り判定
  const shouldPromote = (piece: string, toX: number) => {
    console.log(
      `🧐 成り判定チェック: piece=${piece}, toX=${toX}, isFirstPlayer=${isFirstPlayer}`
    );

    if (piece.toUpperCase() === "K" || piece.toUpperCase() === "G") {
      console.log("⚠️ 成れない駒なのでスキップ");
      return false;
    }

    // 先手の成りゾーン ("一", "二", "三" → 0,1,2)
    if (isFirstPlayer && toX <= 2) {
      console.log("✅ 先手が成れる位置に移動");
      return true;
    }

    // 後手の成りゾーン ("七", "八", "九" → 6,7,8)
    if (!isFirstPlayer && toX >= 6) {
      console.log("✅ 後手が成れる位置に移動");
      return true;
    }

    console.log("❌ 成れない位置");
    return false;
  };

  // 駒の移動リクエスト
  const movePiece = async (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    promote: boolean = false
  ) => {
    if (currentPlayer !== userId) {
      alert("相手のターンです！");
      return;
    }

    const piece = board[fromX][fromY];
    if (!piece) return;

    console.log(
      `🚀 movePiece 実行: ${fromX},${fromY} -> ${toX},${toY}, piece=${piece}`
    );

    // **成り判定チェック**
    if (shouldPromote(piece, toX) && !promote) {
      console.log("🛑 成りのモーダルを表示");
      setPromoteMove({ fromX, fromY, toX, toY });
      setShowPromoteModal(true);
      return; // ✅ 成りの確認をしたら、処理を中断する
    }

    // サーバーに送る座標（常に先手基準）
    const actualFromX = isFirstPlayer ? fromX : 8 - fromX;
    const actualFromY = isFirstPlayer ? fromY : 8 - fromY;
    const actualToX = isFirstPlayer ? toX : 8 - toX;
    const actualToY = isFirstPlayer ? toY : 8 - toY;

    // 移動先に自分の駒があるかチェック
    const targetPiece = board[toX][toY];

    if (
      targetPiece &&
      ((isFirstPlayer && targetPiece === targetPiece.toUpperCase()) ||
        (!isFirstPlayer && targetPiece === targetPiece.toLowerCase()))
    ) {
      alert("自分の駒があります！");
      return;
    }

    console.log(
      `🚀 movePiece 送信: ${actualFromX},${actualFromY} -> ${actualToX},${actualToY}, promote=${promote}`
    );

    try {
      const response = await axios.post(
        "http://localhost:3001/api/shogi/move-piece",
        {
          roomId,
          userId,
          fromX: actualFromX,
          fromY: actualFromY,
          toX: actualToX,
          toY: actualToY,
          promote,
        }
      );

      console.log("🎯 movePiece API レスポンス:", response.data);

      if (response.data.board) {
        setBoard([...response.data.board]);
        setLogs([...response.data.logs]);
        setCurrentPlayer(response.data.currentPlayer);
        setCapturedPieces(response.data.capturedPieces);
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message); // サーバーからのエラーメッセージを表示
      } else {
        alert("駒の移動中にエラーが発生しました");
      }
    }
  };

  // 駒のコンポーネント
  const Piece: React.FC<{
    piece: string;
    x: number;
    y: number;
    isSecondPlayer: boolean;
  }> = ({
    piece,
    x,
    y,
    isSecondPlayer, // ✅ 追加: プレイヤー情報
  }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "PIECE",
      item: { x, y, piece },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    const pieceTypeMap: { [key: string]: string } = {
      P: "pawn",
      p: "pawn",
      K: "king",
      k: "king",
      R: "rook",
      r: "rook",
      B: "bishop",
      b: "bishop",
      G: "gold",
      g: "gold",
      S: "silver",
      s: "silver",
      N: "knight",
      n: "knight",
      L: "lance",
      l: "lance",
      RP: "prom-pawn",
      rp: "prom-pawn",
    };

    const pieceType = pieceTypeMap[piece];

    // ✅ ここを修正: 後手 (`isSecondPlayer === true`) の場合、駒の所有者を逆にする
    const isFirstPlayerPiece = piece === piece.toUpperCase();
    const player = isSecondPlayer
      ? isFirstPlayerPiece
        ? "second" // 本来の先手の駒が、後手視点では相手の駒になる
        : "first" // 本来の後手の駒が、後手視点では自分の駒になる
      : isFirstPlayerPiece
      ? "first"
      : "second";

    const pieceImage = `/image/${player}-${pieceType}.png`;

    return (
      <div
        ref={drag as unknown as React.Ref<HTMLDivElement>}
        className={`cursor-grab ${isDragging ? "opacity-50" : ""}`}
      >
        <img src={pieceImage} alt={pieceType} className="w-8 h-8" />
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
        let { x: fromX, y: fromY } = item;
        let targetX = x;
        let targetY = y;

        // 後手の盤面は座標を反転
        if (!isFirstPlayer) {
          fromX = 8 - fromX;
          fromY = 8 - fromY;
          targetX = 8 - x;
          targetY = 8 - y;
        }

        console.log(
          `🎯 ドロップ: (${fromX},${fromY}) → (${targetX},${targetY})`
        );

        movePiece(fromX, fromY, targetX, targetY);
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
        {piece && <Piece piece={piece} x={x} y={y} isSecondPlayer={!isFirstPlayer} />}
      </div>
    );
  };

  const displayedBoard = isFirstPlayer
    ? board
    : [...board].reverse().map((row) => [...row].reverse());

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex items-center">
        {/* 成りのモーダル */}
        {/* 成りのモーダル */}
        <PromoteModal
          isOpen={showPromoteModal}
          onRequestClose={() => setShowPromoteModal(false)}
          onPromote={async () => {
            if (promoteMove) {
              console.log("✅ 成るを選択");
              await movePiece(
                promoteMove.fromX,
                promoteMove.fromY,
                promoteMove.toX,
                promoteMove.toY,
                true
              );
            }
            setShowPromoteModal(false);
          }}
          onNotPromote={async () => {
            if (promoteMove) {
              console.log("✅ 成らないを選択");
              await movePiece(
                promoteMove.fromX,
                promoteMove.fromY,
                promoteMove.toX,
                promoteMove.toY,
                false
              );
            }
            setShowPromoteModal(false);
          }}
        />

        {/* 先手の駒台 */}
        <div className="flex flex-col items-center mr-4">
          <h3>先手の駒台</h3>
          <div className="grid grid-cols-3 gap-2">
            {capturedPieces.firstPlayer.map((piece, index) => (
              <div
                key={`firstPlayer-${index}`}
                className="w-8 h-8 flex items-center justify-center border border-gray-700"
              >
                {piece}
              </div>
            ))}
          </div>
        </div>

        <div>
          {/* 行番号 (縦) */}
          <div className="flex ">
            {colLabels.map((col, index) => (
              <div
                key={`col-${index}`}
                className="w-16 h-8 flex items-center justify-center"
              >
                {col}
              </div>
            ))}
          </div>

          {/* 盤面 */}
          <div className="flex">
            <div
              className="grid grid-cols-9 border border-gray-700"
              style={{
                backgroundColor: "#F9C270",
                width: "36rem",
                height: "36rem",
              }}
            >
              {displayedBoard.map((row, rowIndex) =>
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
            <div className="flex flex-col">
              {rowLabels.map((row, index) => (
                <div
                  key={`row-${index}`}
                  className="w-8 h-16 flex items-center justify-center"
                >
                  {row}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 後手の駒台 */}
        <div className="flex flex-col items-center ml-4">
          <h3>後手の駒台</h3>
          <div className="grid grid-cols-3 gap-2">
            {capturedPieces.secondPlayer.map((piece, index) => (
              <div
                key={`secondPlayer-${index}`}
                className="w-8 h-8 flex items-center justify-center border border-gray-700"
              >
                {piece}
              </div>
            ))}
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