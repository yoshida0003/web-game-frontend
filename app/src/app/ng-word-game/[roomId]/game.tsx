import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface User {
  id: string;
  username: string;
  ngWord?: string;
  points: number;
}

interface GameProps {
  users: User[];
  userId: string; // 自分のID
  onWordClick: (targetUserId: string) => void; // ワードクリック時の処理
  revealedWord: string | null;
}

const Game: React.FC<GameProps> = ({ users, userId, onWordClick, revealedWord }) => {
  const [showWord, setShowWord] = useState(false); // フェードイン・アウトの状態
  
  useEffect(() => {
    if (revealedWord) {
      setShowWord(true);
      setTimeout(() => {
        setShowWord(false);
      }, 2000); // 2秒後にフェードアウト
    }
  }, [revealedWord]);

  return (
    <div className="container mx-auto p-4">
      {/* 自分の情報を表示 */}
      <div className="mb-8 relative">
        <Card className="p-2 mx-auto bg-gray-100 rounded shadow text-center w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4">
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold" }}
              className="fc-6B8AA0"
            >
              あなたのワード
            </Typography>
            <Typography
              variant="body1"
              className="fc-2EB1F0"
              sx={{ fontWeight: "bold", fontSize: "2rem" }}
            >
              ？？？
            </Typography>
            <Typography
              variant="h6"
              className="fc-6B8AA0"
              sx={{ fontWeight: "bold" }}
            >
              ポイント: {users.find((user) => user.id === userId)?.points}
            </Typography>
          </CardContent>
        </Card>

        {/* フェードイン・アウトするワード */}
        {showWord && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 rounded transition-opacity duration-500">
            <Typography
              variant="h4"
              className="text-white font-bold animate-fade"
            >
              {revealedWord}
            </Typography>
          </div>
        )}
      </div>

      {/* 他のプレイヤーの情報を表示 */}
      <div className="mt-12">
        <div className="flex flex-wrap gap-4">
          {users
            .filter((user) => user.id !== userId) // 自分以外のプレイヤーをフィルタリング
            .map((user) => (
              <Card
                key={user.id}
                onClick={() => {
                  onWordClick(user.id); // ワードクリック時の処理
                }}
                className="flex-1 text-center mx-auto min-w-[300px] max-w-[350px] bg-gray-100 rounded shadow cursor-pointer hover:bg-blue-100 hover:shadow-lg hover:rotate-1 transition-transform duration-300"
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold" }}
                    className="fc-6B8AA0"
                  >
                    {user.username}
                  </Typography>
                  <Typography
                    variant="body1"
                    className="fc-2EB1F0"
                    sx={{ fontWeight: "bold", fontSize: "3rem" }}
                  >
                    {user.ngWord}
                  </Typography>
                  <Typography
                    variant="body1"
                    className="fc-6B8AA0"
                    sx={{ fontWeight: "bold" }}
                  >
                    ポイント: {user.points}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Game;
