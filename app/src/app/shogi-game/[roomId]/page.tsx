"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";

// WebSocket初期化
const socket = io("https://game.yospace.org/api", {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000, // タイムアウトを10秒
});

const ShogiGame = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchRoomData = async () => {
      console.log("部屋データを取得中...");
      try {
        const response = await axios.get(
          `https://game.yospace.org/api/room/${roomId}`
        );
        console.log("部屋データ取得成功:", response.data);
        setUsers(response.data.users);
      } catch (error) {
        console.error("部屋データ取得エラー:", error);
      }
    };

    fetchRoomData();

    socket.on("connect", () => {
      console.log("WebSocket接続成功:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket接続エラー:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("WebSocket切断:", reason);
      if (reason === "io server disconnect") {
        socket.connect(); // サーバー側の切断の場合に再接続
      }
    });

    // サーバーに部屋参加を通知
    console.log("join-roomイベント送信中:", { roomId, userId });
    socket.emit("join-room", { roomId, userId, username: "YourUsername" });

    // イベントリスナーの設定
    socket.on("user-joined", (user) => {
      console.log("user-joinedイベント受信:", user);
      setUsers((prevUsers) => [
        ...prevUsers,
        { id: user.userId, username: user.username },
      ]);
    });

    socket.on("user-left", ({ userId, username }) => {
      console.log("user-leftイベント受信:", { userId, username });
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    });

    socket.on("room-deleted", () => {
      console.warn("部屋が削除されました");
      alert("部屋が閉じられました");
      router.push("/");
    });

    socket.on("server-log", (message) => {
      console.log("サーバーログ:", message);
    });

    // クリーンアップ
    return () => {
      console.log("クリーンアップ中: WebSocketリスナーを削除します");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("server-log");
    };
  }, [roomId, userId, router]);

  const handleLeaveRoom = async () => {
    console.log("部屋退出処理を実行中...");
    try {
      await axios.post(`https://game.yospace.org/api/leave-room`, {
        roomId,
        userId,
      });
      console.log("部屋退出成功");
      socket.emit("leave-room", { roomId, userId, username: "YourUsername" });
      router.push("/");
    } catch (error) {
      console.error("部屋退出エラー:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">将棋ゲーム</h1>
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
      <button
        onClick={handleLeaveRoom}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        退出
      </button>
    </div>
  );
};

export default ShogiGame;
