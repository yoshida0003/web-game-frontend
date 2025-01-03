"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";

const socket = io("https://game.yospace.org/api");

const ShogiGame = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(
          `https://game.yospace.org/api/room/${roomId}`
        );
        setUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();

    socket.emit("join-room", roomId);

    socket.on("user-joined", (user) => {
      setUsers((prevUsers) => [...prevUsers, user]);
    });

    socket.on("user-left", ({ userId }) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [roomId]);

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`https://game.yospace.org/api/leave-room`, {
        roomId,
        userId,
      });
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
          </li>
        ))}
      </ul>
      <button
        onClick={handleLeaveRoom}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        退出
      </button>
    </div>
  );
};

export default ShogiGame;
