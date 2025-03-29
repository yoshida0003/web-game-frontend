"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";
import Game from "./game"; // Gameコンポーネントをインポート

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
  const [timerDuration, setTimerDuration] = useState<number>(300); // タイマーの初期値
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

    // サーバーからの通知をリッスン
    socket.on("user-ready-updated", ({ userId, isReady }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isReady } : user
        )
      );
    });

    socket.on("all-users-ready", ({ allReady }) => {
      setAllReady(allReady); // 全員が準備完了かどうかを更新
      console.log(`全員準備完了: ${allReady}`);
    });

    socket.on("ng-word-game-started", (data) => {
      setGameStarted(true);
      setUsers(data.users);
    });

    socket.on("word-clicked", (data) => {
      // サーバーからポイント更新と新しいNGワードを受信
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.targetUserId
            ? { ...user, points: data.points, ngWord: data.newWord }
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
      console.log(`タイマーのカウントダウンが更新されました: ${countdown}秒`);
    });

    socket.on("game-ended", () => {
      setCountdown(0);
      setShowModal(true);
    });

    socket.on("timer-updated", ({ timerDuration }) => {
      setTimerDuration(timerDuration); // タイマーの更新を反映
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
      socket.off("timer-updated");
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

  const handleSetTimer = async (duration: number) => {
    try {
      await axios.post("http://localhost:3001/api/set-timer", {
        roomId,
        userId,
        timerDuration: duration,
      });
    } catch (error) {
      console.error("時間設定エラー:", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGameStarted(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">NGワードゲーム</h1>
      <h2 className="text-xl mb-4">部屋ID: {roomId}</h2>
      <h3 className="text-lg mb-4">参加者:</h3>
      <ul className="list-disc pl-5">
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            {user.username} {user.id === userId && "(あなた)"}
            <span> (ID: {user.id})</span>
          </li>
        ))}
      </ul>
      {users.map((user) => (
        <div key={user.id}>
          {user.id !== users[0]?.id && user.id === userId && (
            <button
              onClick={handleToggleReady}
              className={`py-2 px-4 rounded ${
                user.isReady
                  ? "bg-gray-500 text-white"
                  : "bg-green-500 text-white"
              }`}
              disabled={user.isReady}
            >
              {user.isReady ? "準備完了済み" : "準備完了"}
            </button>
          )}
        </div>
      ))}
      {users[0]?.id === userId && !gameStarted && (
        <div className="mb-4">
          <h3 className="text-lg font-bold">時間を設定:</h3>
          <div className="flex gap-2">
            {[300, 480, 600, 900, 1800].map((duration) => (
              <button
                key={duration}
                onClick={() => handleSetTimer(duration)}
                className={`py-2 px-4 rounded ${
                  timerDuration === duration
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {duration / 60}分
              </button>
            ))}
          </div>
        </div>
      )}

      {users[0]?.id !== userId && (
        <div className="mb-4">
          <h3 className="text-lg font-bold">現在の時間:</h3>
          <p>{timerDuration / 60}分</p>
        </div>
      )}
      <button
        onClick={handleLeaveRoom}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        退出
      </button>
      {users.length >= 2 && users[0]?.id === userId && !gameStarted && (
        <button
          onClick={handleStartGame}
          className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4 ${
            allReady ? "" : "opacity-50 cursor-not-allowed"
          }`}
          disabled={!allReady}
        >
          ゲーム開始
        </button>
      )}
      {gameStarted && (
        <Game
          users={users}
          countdown={countdown}
          userId={userId}
          onWordClick={handleWordClick}
        />
      )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded shadow-lg">
            <h2 className="text-2xl font-bold mb-4">ゲーム終了！</h2>
            <button
              onClick={handleCloseModal}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGWordGamePage;
