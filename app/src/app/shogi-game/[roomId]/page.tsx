"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true, // 再接続を有効にする
  reconnectionAttempts: 5, // 再接続の試行回数
  reconnectionDelay: 1000, // 再接続の試行間隔（ミリ秒）
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
			setUsers((prevUsers) =>
				prevUsers.filter((user) => user.id !== userId)
			);
			console.log(`${username}さんが退出しました。`);
		});

		socket.on("room-deleted", () => {
			alert("部屋が閉じられました");
			router.push("/");
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