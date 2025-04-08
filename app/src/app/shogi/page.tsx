"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const ShogiPage = () => {
  const [username, setUsername] = useState<string>(""); // ユーザー名
  const [shogiRate, setShogiRate] = useState<number | null>(null); // 将棋レート
  const [roomName, setRoomName] = useState<string>(""); // 部屋名
  const [tab, setTab] = useState<"create" | "join">("create"); // タブの状態
  const [isGuest, setIsGuest] = useState<boolean>(false); // ゲストモード
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // ログイン状態
  const router = useRouter();

  useEffect(() => {
    // ログイン済みのユーザー情報を取得
    const storedNickname = localStorage.getItem("nickname");
    const storedShogiRate = localStorage.getItem("shogiRate");

    if (storedNickname && storedShogiRate) {
      setUsername(storedNickname);
      setShogiRate(Number(storedShogiRate));
      setIsLoggedIn(true); // ログイン状態を設定
    } else {
      setIsGuest(true); // ログイン情報がない場合はゲストモード
    }
  }, []);

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3001/api/create-room",
        {
          roomName,
          username,
          gameType: "shogi",
          userId: isGuest ? undefined : localStorage.getItem("userId"), // ログイン済みのユーザーは自分のuserIdを送信
        }
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
      const response = await axios.post("http://localhost:3001/api/join-room", {
        roomName,
        username,
        gameType: "shogi",
        userId: isGuest ? undefined : localStorage.getItem("userId"), // ログイン済みのユーザーは自分のuserIdを送信
      });
      const { roomId, userId } = response.data;
      router.push(`/shogi-game/${roomId}?userId=${userId}`);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status === 403
      ) {
        alert("部屋がいっぱいです");
      } else {
        alert("部屋が見つかりません");
      }
    }
  };

  const toggleGuestMode = () => {
    setIsGuest(!isGuest);
    if (!isGuest) {
      // ゲストモードに切り替えた場合、ユーザー名をリセット
      setUsername("");
    } else {
      // ログインモードに戻した場合、ローカルストレージから情報を再取得
      const storedNickname = localStorage.getItem("nickname");
      const storedShogiRate = localStorage.getItem("shogiRate");
      if (storedNickname && storedShogiRate) {
        setUsername(storedNickname);
        setShogiRate(Number(storedShogiRate));
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn && (
        <div className="mb-4">
          <button
            onClick={toggleGuestMode}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            {isGuest ? "ログインモードに切り替え" : "ゲストモードに切り替え"}
          </button>
        </div>
      )}
      {!isGuest && isLoggedIn && (
        <div className="mb-4">
          <p className="text-gray-700 font-bold">ニックネーム: {username}</p>
          <p className="text-gray-700 font-bold">将棋レート: {shogiRate}</p>
        </div>
      )}
      {isGuest && (
        <form className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            ニックネーム:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </form>
      )}
      <form className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          部屋の名前:
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
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
        <form
          onSubmit={handleCreateRoom}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            作成
          </button>
        </form>
      )}
      {tab === "join" && (
        <form
          onSubmit={handleJoinRoom}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            参加
          </button>
        </form>
      )}
    </div>
  );
};

export default ShogiPage;
