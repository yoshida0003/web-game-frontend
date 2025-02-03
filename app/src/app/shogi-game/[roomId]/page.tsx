"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";
import GamePage from "./game";

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const ShogiGame = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<(string | null)[][]>([]);
  const [firstPlayer, setFirstPlayer] = useState<{ id: string; username: string } | null>(null);
  const [secondPlayer, setSecondPlayer] = useState<{ id: string; username: string } | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
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

    socket.emit("join-room", { roomId, userId, username: "YourUsername" });

    socket.on("user-joined", (user) => {
      console.log("user-joined event received:", user);
      setUsers((prevUsers) => {
        if (prevUsers.some((existingUser) => existingUser.id === user.userId)) {
          return prevUsers;
        }
        return [...prevUsers, { id: user.userId, username: user.username }];
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

    socket.on("server-log", (message) => {
      console.log(message);
    });

    socket.on("game-started", ({ board, firstPlayer, secondPlayer }) => {
      setGameStarted(true);
      setBoard(board);
      setFirstPlayer(firstPlayer);
      setSecondPlayer(secondPlayer);
      setCurrentPlayer(firstPlayer.id);
      console.log("ゲームが開始されました！");
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("server-log");
      socket.off("game-started");
    };
  }, [roomId, userId, router]);

  useEffect(() => {
    socket.on(
      "cell-clicked",
      ({ x, y, userId, username, position, playerRole }) => {
        // データが正しいか検証
        if (!username || !position || !playerRole) {
          console.error("不正なデータを受信しました:", {
            x,
            y,
            userId,
            username,
            position,
            playerRole,
          });
          return;
        }

        const logMessage = `${username} (${playerRole})：${position}`;
        setLogs((prevLogs) => [...prevLogs, logMessage]);

        // ターン切り替え
        if (firstPlayer && secondPlayer) {
          setCurrentPlayer(
            currentPlayer === firstPlayer.id ? secondPlayer.id : firstPlayer.id
          );
        }
      }
    );

    return () => {
      socket.off("cell-clicked");
    };
  }, [users, firstPlayer, secondPlayer, currentPlayer]);


  const handleLeaveRoom = async () => {
    try {
      await axios.post(`http://localhost:3001/api/leave-room`, {
        roomId,
        userId,
      });
      socket.emit("leave-room", { roomId, userId, username: "YourUsername" });
      router.push("/");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const handleStartGame = async () => {
    try {
      await axios.post(`http://localhost:3001/api/start-game`, { roomId });
    } catch (error) {
      console.error("Error starting game:", error);
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
      {users.length === 2 && users[0].id === userId && !gameStarted && (
        <button
          onClick={handleStartGame}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          ゲーム開始
        </button>
      )}
      <button
        onClick={handleLeaveRoom}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        退出
      </button>
      {gameStarted && userId && (
        <div>
          <h3 className="text-lg mb-4">先手: {firstPlayer?.username}</h3>
          <h3 className="text-lg mb-4">後手: {secondPlayer?.username}</h3>
          <GamePage
            board={board}
            roomId={roomId}
            userId={userId}
            isFirstPlayer={userId === firstPlayer?.id}
            logs={logs}
            currentPlayer={currentPlayer}
          />
        </div>
      )}
    </div>
  );
};

export default ShogiGame;
