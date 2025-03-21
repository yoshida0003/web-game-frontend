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
    nickname?: string;
    message?: string;
    isAdmin?: boolean;
    token: string;
  }

  interface AuthRequestBody {
    email: string;
    password: string;
    nickname?: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = isLogin
      ? "https://game.yospace.org/api/login"
      : "https://game.yospace.org/api/register";
    const body: AuthRequestBody = isLogin ? { email, password } : { email, password, nickname };

    const res: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: AuthResponse = await res.json();
    if (res.ok) {
      if (isLogin && data.isAdmin) {
        localStorage.setItem("token", data.token) // JWTを保存
        router.push("/admin");
      } else {
        alert(isLogin ? `こんにちは！, ${data.nickname}` : "新規登録成功!");
      }
    } else {
      console.error("❌ フロントエンドでエラー発生:", data.message);
      alert(data.message);
    }
  };

  return (
    <div>
      <h1>{isLogin ? "ログイン" : "新規登録"}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {!isLogin && (
          <div>
            <label>Nickname:</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>
        )}
        <button type="submit">{isLogin ? "ログイン" : "新規登録"}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "新規登録はこちら" : "ログインはこちら"}
      </button>
    </div>
  );
};

export default Auth;
