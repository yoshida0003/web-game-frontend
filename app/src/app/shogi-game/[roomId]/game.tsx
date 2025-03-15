import { useState, useEffect } from "react";
import axios from "axios";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import io from "socket.io-client";
import PromoteModal from "./promoteModal";
import Square from "./square";
import CapturedPieces from "./capturedPieces"; // CapturedPieces コンポーネントのインポート
import HamburgerMenu from "./logHumburgerMenu";
import "./shogi.css";

// 環境変数からURLを取得
const socketUrl =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SOCKET_URL_PROD
    : process.env.NEXT_PUBLIC_SOCKET_URL_DEV;

const ShogiapiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SHOGI_API_URL_PROD
    : process.env.NEXT_PUBLIC_SHOGI_API_URL_DEV;

const socket = io(socketUrl, {
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
    firstPlayer: { piece: string; owner: "first" | "second" }[];
    secondPlayer: { piece: string; owner: "first" | "second" }[];
  }>({
    firstPlayer: [],
    secondPlayer: [],
  });
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteMove, setPromoteMove] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignMessage, setResignMessage] = useState("");

  // 盤面のラベル（先手・後手で異なる）
  const rowLabels = isFirstPlayer
    ? ["一", "二", "三", "四", "五", "六", "七", "八", "九"]
    : ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
  const colLabels = isFirstPlayer
    ? ["9", "8", "7", "6", "5", "4", "3", "2", "1"]
    : ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  useEffect(() => {
    socket.on(
      "update-board",
      ({
        roomId: updatedRoomId,
        board,
        currentPlayer,
        logs,
        capturedPieces,
      }) => {
        console.log(
          `📥 [${updatedRoomId}] クライアントが update-board を受信！`,
          {
            board,
            currentPlayer,
            logs,
            capturedPieces,
          }
        );

        setBoard([...board]);
        setCurrentPlayer(currentPlayer);
        setLogs([...logs]);

        setCapturedPieces({
          firstPlayer: capturedPieces.firstPlayer,
          secondPlayer: capturedPieces.secondPlayer,
        });
      }
    );

    socket.on("game-over", ({ message }) => {
      setResignMessage(message);
      setShowResignModal(true);
    });

    console.log(`📡 クライアントが部屋 ${roomId} に join-room を送信！`);
    socket.emit("join-room", { roomId, userId });

    socket.on("user-joined", ({ userId, username }) => {
      console.log(`👥 [${roomId}] ${username} (${userId}) が部屋に参加！`);
    });

    return () => {
      socket.off("update-board");
      socket.off("game-over");
    };
  }, [socket, roomId, userId]);

  // 成り判定
  const shouldPromote = (
    piece: string,
    fromX: number,
    toX: number,
    fromCaptured: boolean
  ) => {
    console.log(
      `🧐 成り判定チェック: piece=${piece}, fromX=${fromX}, toX=${toX}, fromCaptured=${fromCaptured}, isFirstPlayer=${isFirstPlayer}`
    );

    // **駒台から打つ駒は成れない**
    if (fromCaptured) {
      console.log("⚠️ 駒台から打つ駒なのでスキップ");
      return false;
    }

    // **すでに成り駒ならモーダル不要**
    const promotedPieces = [
      "PP",
      "pp",
      "PR",
      "pr",
      "PB",
      "pb",
      "PS",
      "ps",
      "PN",
      "pn",
      "PL",
      "pl",
    ];
    if (promotedPieces.includes(piece)) {
      console.log("⚠️ すでに成っている駒なのでスキップ");
      return false;
    }

    // **成れない駒**
    if (["K", "G"].includes(piece)) {
      console.log("⚠️ 成れない駒なのでスキップ");
      return false;
    }

    // **先手の成りゾーン ("一", "二", "三" → 0,1,2)**
    if (isFirstPlayer && (fromX <= 2 || toX <= 2)) {
      console.log("✅ 先手が成れる位置に移動");
      return true;
    }

    // **後手の成りゾーン ("七", "八", "九" → 6,7,8)**
    if (!isFirstPlayer && (fromX >= 6 || toX >= 6)) {
      console.log("✅ 後手が成れる位置に移動");
      return true;
    }

    console.log("❌ 成れない位置");
    return false;
  };

  const shouldAutoPromote = (
    piece: string,
    toX: number,
    isFirstPlayer: boolean
  ): boolean => {
    // 歩の自動成り判定
    if (piece.toLowerCase() === "p") {
      if ((isFirstPlayer && toX === 0) || (!isFirstPlayer && toX === 8)) {
        return true; // 相手陣営の1段目に進む場合は自動的に成る
      }
    }

    // 桂馬の自動成り判定
    if (piece.toLowerCase() === "n") {
      if ((isFirstPlayer && toX <= 1) || (!isFirstPlayer && toX >= 7)) {
        return true; // 相手陣営の1, 2段目に進む場合は自動的に成る
      }
    }

    // 香車の自動成り判定
    if (piece.toLowerCase() === "l") {
      if ((isFirstPlayer && toX === 0) || (!isFirstPlayer && toX === 8)) {
        return true; // 相手陣営の1段目に進む場合は自動的に成る
      }
    }

    return false;
  };

  // 駒の移動リクエスト
  const movePiece = async (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    promote: boolean | null = null
  ) => {
    if (currentPlayer !== userId) {
      alert("相手のターンです！");
      return;
    }

    let piece = board[fromX]?.[fromY];
    let fromCaptured = false;

    if (fromX === 9 || fromX === 10) {
      // 駒台からの駒の場合
      const capturedPiecesList =
        fromX === 9 ? capturedPieces.firstPlayer : capturedPieces.secondPlayer;
      piece = capturedPiecesList[fromY]?.piece;
      fromCaptured = true; // 駒台からの駒であることを示す

      // ログを追加
      if (piece) {
        const player = fromX === 9 ? "先手" : "後手";
        console.log(`${player}の駒台から掴みました: ${piece}`);
      }
    }

    if (!piece) return;

    // ✅ 小文字の駒は全て後手の駒と判定
    const isOwnPiece =
      (isFirstPlayer && piece === piece.toUpperCase()) || // 先手の駒（大文字）
      (!isFirstPlayer && piece === piece.toLowerCase()); // 後手の駒（小文字 & 成り駒）

    if (!isOwnPiece) {
      alert("相手の駒は動かせません！");
      return;
    }

    console.log(
      `🚀 movePiece 実行: ${fromX},${fromY} -> ${toX},${toY}, piece=${piece}`
    );

    // **自動成り判定チェック**
    if (shouldAutoPromote(piece, toX, isFirstPlayer)) {
      promote = true;
    }

    // サーバーに送る座標（常に先手基準）
    let actualFromX = fromX;
    let actualFromY = fromY;
    let actualToX = toX;
    let actualToY = toY;

    if (fromX !== 9 && fromX !== 10) {
      actualFromX = isFirstPlayer ? fromX : 8 - fromX;
      actualFromY = isFirstPlayer ? fromY : 8 - fromY;
      actualToX = isFirstPlayer ? toX : 8 - toX;
      actualToY = isFirstPlayer ? toY : 8 - toY;
    }

    console.log(
      `🚀 movePiece 送信: ${actualFromX},${actualFromY} -> ${actualToX},${actualToY}, 成り=${promote}`
    );

    try {
      // まず移動が合法かどうかをチェック
      const validateResponse = await axios.post(
        `${ShogiapiUrl}/validate-move`,
        {
          roomId,
          userId,
          fromX: actualFromX,
          fromY: actualFromY,
          toX: actualToX,
          toY: actualToY,
        }
      );
      
      console.log("🎯 validateMove API レスポンス:", validateResponse.data);

      // 移動が合法であれば成りのモーダルを表示
      if (validateResponse.data.message === "移動は合法です") {
        // **成り判定チェック**
        if (
          !fromCaptured &&
          promote === null &&
          shouldPromote(piece, fromX, toX, fromCaptured)
        ) {
          console.log("🛑 成りのモーダルを表示");
          setPromoteMove({ fromX, fromY, toX, toY });
          setShowPromoteModal(true);
          return; // ✅ 初回の成り確認で処理を中断
        }

        // 実際に移動を行う
        const response = await axios.post(
          `${ShogiapiUrl}/move-piece`,
          {
            roomId,
            userId,
            fromX: actualFromX,
            fromY: actualFromY,
            toX: actualToX,
            toY: actualToY,
            promote: promote ?? false, // 🚀 成らない場合も確実に false を送る
          }
        );

        console.log("🎯 movePiece API レスポンス:", response.data);

        // ✅ サーバーのレスポンスを受けて UI を更新
        if (response.data.board) {
          setBoard([...response.data.board]);
          setLogs([...response.data.logs]);
          setCurrentPlayer(response.data.currentPlayer);
          setCapturedPieces(response.data.capturedPieces);
        }
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message); // サーバーからのエラーメッセージを表示
        return; // 🚀 エラーが発生した場合はモーダルを表示しない
      } else {
        alert("駒の移動中にエラーが発生しました");
        return; // 🚀 エラーが発生した場合はモーダルを表示しない
      }
    }
  };

  const resign = async () => {
    try {
      const response = await axios.post(
        `${ShogiapiUrl}/resign`,
        {
          roomId,
          userId,
        }
      );
      console.log("🎯 resign API レスポンス:", response.data);
      alert("降参しました");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message); // サーバーからのエラーメッセージを表示
      } else {
        alert("降参中にエラーが発生しました");
      }
    }
  };

  const displayedBoard = isFirstPlayer
    ? board
    : [...board].reverse().map((row) => [...row].reverse());

  return (
    <div className="shogiGamePage">
      <DndProvider backend={HTML5Backend}>
        <div className="flex items-center">
          {/* ハンバーガーメニュー */}
          <HamburgerMenu logs={logs} />

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
          {/* 降参モーダル */}
          {showResignModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>{resignMessage}</h2>
                <button onClick={() => setShowResignModal(false)}>OK</button>
              </div>
            </div>
          )}
          <div className="flex items-center">
            <div className="pr-4">
              {/* 🟢 相手の駒台（自分が先手なら後手の駒台、自分が後手なら先手の駒台） */}
              <h3 className="text-center mb-2">{isFirstPlayer ? "後手の駒台" : "先手の駒台"}</h3>
              <div className="flex flex-col justify-center items-center mb-96 w-36 h-36 border border-gray-700 bg-yellow-300">
                <CapturedPieces
                  capturedPieces={
                    isFirstPlayer
                      ? capturedPieces.secondPlayer
                      : capturedPieces.firstPlayer
                  }
                  isFirstPlayer={isFirstPlayer}
                  playerSide={isFirstPlayer ? "second" : "first"}
                />
              </div>
            </div>

            {/* 盤面 */}
            <div className="">
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
                <div className="grid grid-cols-9 border border-gray-700 bg-yellow-300 w-[36rem] h-[36rem]">
                  {displayedBoard.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <Square
                        key={`${rowIndex}-${colIndex}`}
                        x={rowIndex}
                        y={colIndex}
                        piece={cell}
                        movePiece={movePiece}
                        isFirstPlayer={isFirstPlayer}
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

            {/* 🟢 自分の駒台（自分が先手なら先手の駒台、自分が後手なら後手の駒台） */}
            <div className="pl-4 pt-2">
              <div className="flex flex-col items-center pt-72">
                <button
                  onClick={resign}
                  className="mb-24 p-2 bg-red-500 text-white"
                >
                  降参
                </button>
                <h3 className="mb-2">
                  {isFirstPlayer ? "先手の駒台" : "後手の駒台"}
                </h3>
                <div className="flex flex-col justify-center items-center w-36 h-36 border border-gray-700 bg-yellow-300">
                  <CapturedPieces
                    capturedPieces={
                      isFirstPlayer
                        ? capturedPieces.firstPlayer
                        : capturedPieces.secondPlayer
                    }
                    isFirstPlayer={isFirstPlayer}
                    playerSide={isFirstPlayer ? "first" : "second"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndProvider>
      <h3 className="mt-4 text-center">
        {currentPlayer === userId ? "あなたのターンです" : "相手のターンです"}
      </h3>
    </div>
  );
};

export default GamePage;
