"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  interface AuthResponse {
    userId?: string; // userIdを追加
    nickname?: string;
    message?: string;
    isAdmin?: boolean;
    token: string;
    shogiRate: number;
  }

  interface AuthRequestBody {
    email: string;
    password: string;
    nickname?: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = isLogin
      ? "http://localhost:3001/api/login"
      : "http://localhost:3001/api/register";
    const body: AuthRequestBody = isLogin
      ? { email, password }
      : { email, password, nickname };

    const res: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: AuthResponse = await res.json();
    console.log("サーバーからのレスポンス:", data); // ここで確認

    if (res.ok) {
      console.log(data.userId)
      localStorage.setItem("nickname", data.nickname || ""); // ニックネームを保存
      localStorage.setItem("token", data.token); // JWTを保存
      if (data.userId) {
        localStorage.setItem("userId", data.userId); // userIdを保存
      }
      localStorage.setItem("shogiRate", data.shogiRate.toString());
      if (isLogin && data.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/"); // ホーム画面にリダイレクト
      }
    } else {
      console.error("❌ フロントエンドでエラー発生:", data.message);
      alert(data.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        {isLogin ? "ログイン" : "新規登録"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        {!isLogin && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nickname:
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          {isLogin ? "ログイン" : "新規登録"}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="text-blue-500 hover:text-blue-700 font-bold"
      >
        {isLogin ? "新規登録はこちら" : "ログインはこちら"}
      </button>
    </div>
  );
};

export default Auth;
