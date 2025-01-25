"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";

const socket = io("https://game.yospace.org/api", {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const ShogiGame = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(
          `https://game.yospace.org/api/room/${roomId}`
        );
        setUsers(response.data.users);
        const currentUser = response.data.users.find(
          (user: { id: string; username: string }) => user.id === userId
        );
        if (currentUser) {
          setUsername(currentUser.username);
          socket.emit("join-room", {
            roomId,
            userId,
            username: currentUser.username,
          });
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();

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

    socket.on("server-log", (message) => {
      console.log(message);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("server-log");
    };
  }, [roomId, userId, router]);

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`https://game.yospace.org/api/leave-room`, {
        roomId,
        userId,
      });
      socket.emit("leave-room", { roomId, userId, username });
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
