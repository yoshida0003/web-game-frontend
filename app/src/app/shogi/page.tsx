"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const apiUrl =
  process.env.NEXT_PUBLIC_MODE === "production"
    ? process.env.NEXT_PUBLIC_API_URL_PROD
    : process.env.NEXT_PUBLIC_API_URL_DEV;

const ShogiPage = () => {
  const [username, setUsername] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [tab, setTab] = useState<"create" | "join">("create");
  const router = useRouter();

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiUrl}/create-room`,
        { roomName, username, gameType: "shogi" }
      );
      const { roomId, userId } = response.data;
      router.push(`/shogi-game/${roomId}?userId=${userId}`);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiUrl}/join-room`,
        {
          roomName,
          username,
          gameType: "shogi",
        }
      );
      const { roomId, userId } = response.data;
      router.push(`/shogi-game/${roomId}?userId=${userId}`);
    } catch (error) {
      if (
        axios.isAxiosError(error) && error.response && error.response.status === 403
      ) {
        alert("部屋がいっぱいです");
      } else {
        alert("部屋が見つかりません");
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ユーザーネーム:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </label>
      </form>
      <div className="mb-4">
        <button
          onClick={() => setTab("create")}
          className={`mr-2 py-2 px-4 rounded ${
            tab === "create"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          部屋を作る
        </button>
        <button
          onClick={() => setTab("join")}
          className={`py-2 px-4 rounded ${
            tab === "join"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          部屋に参加する
        </button>
      </div>
      {tab === "create" && (
        <div>
          <form
            onSubmit={handleCreateRoom}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          >
            <label className="block text-gray-700 text-sm font-bold mb-2">
              部屋の名前を入力:
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </label>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              作成
            </button>
          </form>
        </div>
      )}
      {tab === "join" && (
        <div>
          <form
            onSubmit={handleJoinRoom}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          >
            <label className="block text-gray-700 text-sm font-bold mb-2">
              部屋の名前を入力:
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </label>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              参加
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShogiPage;
