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
}

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const NGWordGamePage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showModal, setShowModal] = useState(false); // モーダルの表示状態を管理
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false); // 送信済みフラグを追加
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

    socket.on("timer-update", (data) => {
      setCountdown(data.countdown);
    });

    socket.on("game-ended", () => {
      setCountdown(0);
      setShowModal(true);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("ng-word-game-started");
      socket.off("word-clicked");
      socket.off("timer-update");
      socket.off("game-ended");
    };
  }, [roomId, userId, username, hasJoinedRoom]);

  const handleStartGame = async () => {
    try {
      await axios.post("http://localhost:3001/api/start-ng-word-game", {
        roomId,
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const handleWordClick = async (targetUserId: string) => {
    try {
      await axios.post("http://localhost:3001/api/click-word", {
        roomId,
        targetUserId,
      });
    } catch (error) {
      console.error("Error clicking word:", error);
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
      console.error("Error leaving room:", error);
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