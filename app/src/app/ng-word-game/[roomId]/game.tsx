import React from "react";

interface User {
  id: string;
  username: string;
  ngWord?: string;
  points: number;
}

interface GameProps {
  users: User[];
  countdown: number;
  userId: string; // 自分のID
  onWordClick: (targetUserId: string) => void; // ワードクリック時の処理
}

const Game: React.FC<GameProps> = ({
  users,
  countdown,
  userId,
  onWordClick,
}) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">NGワード一覧</h1>
      <h3 className="text-lg font-bold mb-4">残り時間: {countdown}秒</h3>
      <ul className="list-disc pl-5">
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            {user.username} - NGワード:{" "}
            {user.id === userId ? (
              "？" // 自分のNGワードは「？」として表示
            ) : (
              <button
                onClick={() => onWordClick(user.id)} // 他のプレイヤーのワードをクリック可能
                className="text-blue-500 underline"
              >
                {user.ngWord}
              </button>
            )}{" "}
            - ポイント: {user.points} {/* ポイントを表示 */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Game;
