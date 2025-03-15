"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";
import adobeLoader from "../../adobeLoader";
import "./shogi.css";
import GamePage from "./game";
import adobeLoader from "../../adobeLoader";
import "./shogi.css";

// 環境変数からURLを取得
const socketUrl =
  process.env.NEXT_PUBLIC_MODE === "production"
    ? process.env.NEXT_PUBLIC_SOCKET_URL_PROD
    : process.env.NEXT_PUBLIC_SOCKET_URL_DEV;

const apiUrl =
  process.env.NEXT_PUBLIC_MODE === "production"
    ? process.env.NEXT_PUBLIC_API_URL_PROD
    : process.env.NEXT_PUBLIC_API_URL_DEV;

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const ShogiGame = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<(string | null)[][]>([]);
  const [firstPlayer, setFirstPlayer] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [secondPlayer, setSecondPlayer] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");

  useEffect(() => {
    if (process.browser) adobeLoader(document);
  }, []);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/room/${roomId}`
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

    socket.on("game-over", ({ message }) => {
      console.log(message);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("server-log");
      socket.off("game-started");
      socket.off("game-over");
    };
  }, [roomId, userId, router]);

  useEffect(() => {
    socket.on(
      "cell-clicked",
      ({ x, y, userId, username, position, playerRole }) => {
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
      await axios.post(`${apiUrl}/leave-room`, {
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
      await axios.post(`${apiUrl}/start-game`, { roomId });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  return (
    <div className="container mx-auto bg-EFEBE5 w-full shogi-font min-w-[1024px] overflow-auto h-screen">
      <div className="px-24">
        <div className="flex pt-8 justify-center">
          <div>
            <h1 className="font-bold mb-4 md:text-4xl lg:text-6xl whitespace-nowrap">
              将棋対戦
            </h1>
            <h2 className="text-lg md:text-xl lg:text-2xl mb-4 whitespace-nowrap">
              部屋ID: {roomId}
            </h2>
          </div>
          {firstPlayer?.username && secondPlayer?.username && (
            <div className="lg:w-2/5 w-2/3 max-w-3xl mx-auto md:ml-[10%] lg:ml-[13%] overflow-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl">先手</h3>
                <h3 className="text-xl">後手</h3>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <p className="text-5xl lg:text-5xl">{firstPlayer.username}</p>
                </div>
                <p className="text-2xl lg:text-2xl mb-4 md:mb-0">対</p>
                <div className="flex items-center">
                  <p className="text-5xl lg:text-5xl">
                    {secondPlayer.username}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <hr className="border-t-2 border-gray-300" />
              </div>
            </div>
          )}
        </div>
        {!firstPlayer?.username && !secondPlayer?.username && (
          <ul className="list-none pl-5">
            {users.map((user) => (
              <li key={user.id} className="mb-2">
                {user.username} {user.id === userId && "(あなた)"}
                <span> (ID: {user.id})</span>
              </li>
            ))}
          </ul>
        )}
        {users.length === 2 && users[0].id === userId && !gameStarted && (
          <button
            onClick={handleStartGame}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
          >
            ゲーム開始
          </button>
        )}
        {!firstPlayer?.username && !secondPlayer?.username && (
          <button
            onClick={handleLeaveRoom}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            退出
          </button>
        )}
        {gameStarted && userId && (
          <div className="flex justify-center">
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
    </div>
  );

};

export default ShogiGame;
