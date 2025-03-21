"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // next/router ではなく next/navigation を使用

const AdminPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // ローディング状態を追加

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔍 JWTトークン:", token); // JWTトークンをログに出力

    if (!token) {
      console.log(
        "❌ トークンが見つかりません。ログインページにリダイレクトします。"
      );
      router.push("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("https://game.yospace.org/api/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        console.log("🔍 サーバーからのレスポンス:", data); // サーバーからのレスポンスをログに出力

        if (!res.ok || !data.decoded.isAdmin) {
          console.log(
            "❌ 管理者権限がありません。ログインページにリダイレクトします。"
          );
          router.push("/");
        } else {
          setLoading(false); // 認証が成功したらローディング状態を解除
        }
      } catch (error) {
        console.error("❌ トークンの検証中にエラーが発生しました:", error);
        router.push("/");
      }
    };

    verifyToken();

    // ページを閉じたときにトークンを削除
    const handleBeforeUnload = () => {
      localStorage.removeItem("token");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

  if (loading) {
    return <div>Loading...</div>; // ローディング中の表示
  }

  return (
    <div>
      <h1>管理者ページ</h1>
      <p>ここは管理者専用のページです。</p>
    </div>
  );
};

export default AdminPage;
