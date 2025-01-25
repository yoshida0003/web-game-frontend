"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";

interface User {
  id: string;
  username: string;
}

interface UserJoinedEvent {
  userId: string;
  username: string;
}

interface UserLeftEvent {
  userId: string;
  username: string;
}

const socket = io("https://game.yospace.org/api", {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true, // 再接続を有効にする
  reconnectionAttempts: 5, // 再接続の試行回数
  reconnectionDelay: 1000, // 再接続の試行間隔（ミリ秒）
});

const ShogiGame = () => {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(
          `https://game.yospace.org/api/room/${roomId}` // http://localhost:3001/api/room/${roomId}
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
    const handleUserJoined = (user: UserJoinedEvent) => {
      console.log("user-joined event received:", user);
      setUsers((prevUsers) => [
        ...prevUsers,
        { id: user.userId, username: user.username },
      ]);
      console.log(`${user.username}さんが入室しました。`);
    };

    const handleUserLeft = ({ userId, username }: UserLeftEvent) => {
      console.log(`${username}さんが退出しました。`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    };

    const handleRoomDeleted = () => {
      alert("部屋が閉じられました");
      router.push("/");
    };

    const handleServerLog = (message: string) => {
      console.log(message);
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-deleted", handleRoomDeleted);
    socket.on("server-log", handleServerLog);

    // クリーンアップ処理
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-deleted", handleRoomDeleted);
      socket.off("server-log", handleServerLog);
    };
  }, [roomId, userId, router]);

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`https://game.yospace.org/api/leave-room`, {
        roomId,
        userId,
      });
      socket.emit("leave-room", { roomId, userId, username: "YourUsername" }); // 退室イベントを送信
      router.push("/");
    } catch (error) {
      console.error("Error leaving room:", error);
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
