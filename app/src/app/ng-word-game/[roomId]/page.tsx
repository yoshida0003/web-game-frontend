"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";
import Game from "./game"; // Gameコンポーネントをインポート

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const NGWordGamePage = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/room/${roomId}`
        );
        setUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();

    // サーバーに部屋への参加を通知
    socket.emit("join-room", { roomId, userId, username: "YourUsername" });

    // サーバーからの通知をリッスン
    socket.on("user-joined", (user) => {
      console.log("user-joined event received:", user);
      setUsers((prevUsers) => [
        ...prevUsers,
        { id: user.userId, username: user.username },
      ]);
      console.log(`${user.username}さんが入室しました。`);
    });

    socket.on("user-left", ({ userId, username }) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      console.log(`${username}さんが退出しました。`);
    });

    socket.on("room-deleted", () => {
      alert("部屋が閉じられました");
      router.push("/");
    });

    socket.on("ng-word-game-started", (data) => {
      alert(data.message);
      setGameStarted(true);
      console.log("NGワードゲームが開始されました:", data);
    });

    // サーバーからのログをリッスン
    socket.on("server-log", (message) => {
      console.log(message);
    });

    // クリーンアップ処理
    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("ng-word-game-started");
      socket.off("server-log");
    };
  }, [roomId, userId, router]);

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`http://localhost:3001/api/leave-room`, {
        roomId,
        userId,
      });
      socket.emit("leave-room", { roomId, userId, username: "YourUsername" }); // 退室イベントを送信
      router.push("/");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const handleStartGame = async () => {
    try {
      await axios.post(`http://localhost:3001/api/start-ng-word-game`, {
        roomId,
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
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
      <button
        onClick={handleLeaveRoom}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        退出
      </button>
      {users.length >= 2 && !gameStarted && (
        <button
          onClick={handleStartGame}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4"
        >
          ゲーム開始
        </button>
      )}
      {gameStarted && userId && (
        <div>
          <Game users={users} />
        </div>
      )}
    </div>
  );
};

export default NGWordGamePage;
