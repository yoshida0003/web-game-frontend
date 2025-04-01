"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";
import Game from "./game"; // Gameコンポーネントをインポート
import RuleGuide from "./ruleguide";
import TimerSettings from "./TimerSetting";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import './ngWord.css'

interface User {
  id: string;
  username: string;
  ngWord?: string;
  points: number;
  isReady?: boolean;
}

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const NGWordGamePage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allReady, setAllReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [showModal, setShowModal] = useState(false); // モーダルの表示状態を管理
  const [timerModal, setTimerModal] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(300); // タイマーの初期値
  const [revealedWord, setRevealedWord] = useState<string | null>(null); // フェードインするワード
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId")!;
  const username = searchParams.get("username")!; // クエリパラメータからusernameを取得

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/room/${roomId}`
        );
        setUsers(response.data.users);
        setTimerDuration(response.data.timerDuration || 300); // サーバーからタイマーの初期値を取得
        setCountdown(response.data.timerDuration);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();

    // サーバーに部屋への参加を通知
    socket.emit("join-room", { roomId, userId, username });

    // サーバーからの通知をリッスン
    socket.on("user-joined", (user) => {
      console.log("user-joined event received:", user);
      setUsers((prevUsers) => {
        if (prevUsers.some((existingUser) => existingUser.id === user.userId)) {
          return prevUsers;
        }
        return [
          ...prevUsers,
          { id: user.userId, username: user.username, points: 0 },
        ];
      });
      console.log(`${user.username}さんが入室しました。`);
    });

    socket.on("user-left", ({ userId, username }) => {
      console.log(`${username}さんが退出しました。`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    });

    socket.on("room-deleted", () => {
      alert("部屋が閉じられました");
      router.push("/");
    });

    socket.on("user-ready-updated", (data) => {
      console.log("受信した user-ready-updated データ:", data);

      const updatedUsers = Array.isArray(data.users) ? data.users : [data];

      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          const updatedUser: User | undefined = updatedUsers.find(
            (u: { userId: string }) => u.userId === user.id
          );
          return updatedUser ? { ...user, isReady: updatedUser.isReady } : user;
        })
      );

      // 全員が準備完了しているか確認して allReady を更新
      const allReadyNow = updatedUsers.every((user: User) => user.isReady);
      setAllReady(allReadyNow);
    });

    socket.on("all-users-ready", ({ allReady }) => {
      setAllReady(allReady); // 全員が準備完了かどうかを更新
      console.log(`全員準備完了: ${allReady}`);
    });

    socket.on("ng-word-game-started", (data) => {
      setGameStarted(true);
      setUsers(data.users);
    });

    // サーバーでワードが更新されたユーザー以外が更新されたユーザーの新しいワードを受信できる
    // クライアントサイドの操作の防止
    socket.on("word-clicked", (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.targetUserId
            ? { ...user, points: data.points, ngWord: data.newWord } // 新しいワードを更新
            : user
        )
      );
    });

    // サーバーからタイマーの設定変更通知を受信
    socket.on("timer-updated", ({ timerDuration }) => {
      setTimerDuration(timerDuration); // タイマーの設定時間を更新
      setCountdown(timerDuration); // カウントダウンの初期値を設定
      console.log(`タイマーの設定が変更されました: ${timerDuration}秒`);
    });

    // サーバーからタイマーの現在のカウントダウン値を受信
    socket.on("timer-update", ({ countdown }) => {
      setCountdown(countdown); // 現在のカウントダウン値を更新
    });

    socket.on("game-ended", () => {
      setCountdown(0);
      setShowModal(true);
    });

    socket.on("game-result", (data) => {
      console.log("🔹 game-result イベントを受信:", data);
      setResultMessage(data.message); // 結果メッセージを設定
      setShowModal(true); // モーダルを表示
    });

    socket.on("timer-updated", ({ timerDuration }) => {
      setTimerDuration(timerDuration); // タイマーの更新を反映
    });

    // クライアント側のSocket.ioリスナー
    socket.on("word-revealed", (data) => {
      console.log(data.message); // ログに通知を表示
      alert(data.message); // 必要に応じてアラートを表示

      // ポイントを更新
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, points: data.points } : user
        )
      );
    });

    // サーバーからフェードインするワードを受信
    socket.on("word-revealed-to-self", (data) => {
      console.log("🔹 word-revealed-to-self イベントを受信:", data);
      setRevealedWord(data.word); // フェードインするワードを設定
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("user-ready-updated");
      socket.off("all-users-ready");
      socket.off("ng-word-game-started");
      socket.off("word-clicked");
      socket.off("timer-update");
      socket.off("game-ended");
      socket.off("game-result");
      socket.off("timer-updated");
      socket.off("word-revealed-to-self");
    };
  }, [roomId, userId, username]);

  const handleToggleReady = async () => {
    try {
      await axios.post("http://localhost:3001/api/toggle-ready", {
        roomId,
        userId,
      });
    } catch (error) {
      console.error("準備状態の更新エラー:", error);
    }
  };

  const handleStartGame = async () => {
    try {
      await axios.post("http://localhost:3001/api/start-ng-word-game", {
        roomId,
      });
    } catch (error) {
      console.error("スターとエラー:", error);
    }
  };

  const handleWordClick = async (targetUserId: string) => {
    try {
      await axios.post("http://localhost:3001/api/click-word", {
        roomId,
        targetUserId,
      });
    } catch (error) {
      console.error("ワード更新エラー:", error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await axios.post("http://localhost:3001/api/leave-room", {
        roomId,
        userId,
      });
      socket.emit("leave-room", { roomId, userId, username });
      router.push("/");
    } catch (error) {
      console.error("退出エラー:", error);
    }
  };

  const handleTimerUpdate = (duration: number) => {
    setTimerDuration(duration); // タイマーの値を更新
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGameStarted(false);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto pt-4 px-8 lg:px-36 xl:px-48 bg-2EB1F0 min-h-screen w-full">
      <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
        <Button
          onClick={handleLeaveRoom}
          className="border-FAF9FB fc-FAF9FB px-6 md:px-12 h-10 md:h-12 text-sm md:text-base"
        >
          ルームを退出
        </Button>
        <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-shadow-lg fc-FAF9FB text-center">
          NGワードゲーム
        </h1>
        <div className="flex flex-col items-center justify-center text-shadow-lg font-bold fc-FAF9FB">
          {!gameStarted ? (
            <div className="text-center">
              <h3 className="text-base md:text-lg lg:text-3xl">制限時間</h3>
              <p className="text-xl md:text-3xl lg:text-5xl mt-2">
                {formatTime(timerDuration)}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-base md:text-lg lg:text-3xl">残り時間</h3>
              <p className="text-xl md:text-3xl lg:text-5xl mt-2">
                {formatTime(countdown)}
              </p>
            </div>
          )}
        </div>
      </div>
      {!gameStarted && (
        <div>
          <div className="mt-4">
            <RuleGuide />
          </div>
          <h3 className="text-5xl mt-8 mb-6 text-center  text-shadow-lg font-bold fc-FAF9FB">
            参加プレイヤー
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 md:gap-x-8 md:gap-y-6 text-center mx-4 md:mx-12 xl:mx-36">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex justify-center items-center text-sm md:text-lg xl:text-2xl fc-2EB1F0 font-bold bg-FAF9FB shadow-lg rounded-xl px-4 py-2"
              >
                <span className="w-8 md:w-12 flex-shrink-0 text-right font-mono tabular-nums">
                  {index + 1}.
                </span>
                <span className="ml-2 flex-grow text-left">
                  {user.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-center mt-6 gap-6">
        {users.length >= 2 && users[0]?.id === userId && !gameStarted && (
          <Button
            onClick={handleStartGame}
            className={`bg-green-500 hover:bg-green-700 text-white ${
              allReady ? "" : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!allReady}
          >
            ゲーム開始
          </Button>
        )}
        {/* 時間設定ボタン */}
        {users[0]?.id === userId && !gameStarted && (
          <Button
            onClick={() => setTimerModal(true)}
            className="bg-blue-500 text-white"
          >
            時間設定
          </Button>
        )}
        {users
          .filter((user) => user.id !== users[0]?.id && user.id === userId) // 条件に該当するユーザーのみ処理
          .map((user) => (
            <Button
              key={user.id}
              onClick={handleToggleReady}
              className={`${
                user.isReady
                  ? "bg-gray-500 text-white"
                  : "bg-green-500 text-white"
              }`}
              disabled={user.isReady}
            >
              {user.isReady ? "準備完了済み" : "準備完了"}
            </Button>
          ))}
      </div>
      {gameStarted && (
        <Game
          users={users}
          userId={userId}
          onWordClick={handleWordClick}
          revealedWord={revealedWord}
        />
      )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded shadow-lg">
            <h2 className="text-2xl font-bold mb-4">ゲーム結果</h2>
            <p className="text-lg mb-4">{resultMessage}</p>
            <Button
              onClick={handleCloseModal}
              className="bg-blue-500 hover:bg-blue-700 text-white"
            >
              閉じる
            </Button>
          </div>
        </div>
      )}
      {/* モーダル */}
      <Modal isOpen={timerModal} onClose={() => setTimerModal(false)}>
        <TimerSettings
          roomId={roomId}
          userId={userId}
          timerDuration={timerDuration}
          onTimerUpdate={(duration) => {
            handleTimerUpdate(duration);
            setShowModal(false); // 時間設定後にモーダルを閉じる
          }}
        />
      </Modal>
    </div>
  );
};

export default NGWordGamePage;
