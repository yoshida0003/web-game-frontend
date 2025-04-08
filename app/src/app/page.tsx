"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [nickname, setNickname] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedNickname = localStorage.getItem("nickname");
    setNickname(storedNickname);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nickname");
    localStorage.removeItem("token");
    setNickname(null);
    router.push("/Auth"); // 認証ページにリダイレクト
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="absolute top-4 left-4 flex items-center space-x-4">
        {nickname && (
          <>
            <span className="text-gray-700 font-bold">{nickname}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
            >
              ログアウト
            </button>
          </>
        )}
      </div>
      <h1 className="text-4xl font-bold mb-8 text-blue-600">
        ウェブゲームへようこそ！
      </h1>
      <div className="grid gap-6 w-full max-w-md">
        <Link
          href="/shogi"
          className="block bg-blue-500 text-white text-center py-4 rounded-lg shadow-lg hover:bg-blue-600 transition"
        >
          将棋ページ
        </Link>
        <Link
          href="./ng-word"
          className="block bg-green-500 text-white text-center py-4 rounded-lg shadow-lg hover:bg-green-600 transition"
        >
          NGワードゲーム
        </Link>
        <Link
          href="./Auth"
          className="block bg-red-500 text-white text-center py-4 rounded-lg shadow-lg hover:bg-red-600 transition"
        >
          認証
        </Link>
      </div>
    </div>
  );
}
