"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddNgWord from "./addNgWord";
import ImportNgWords from "./importNgWords";

const AdminPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
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
        if (!res.ok || !data.decoded.isAdmin) {
          router.push("/");
        } else {
          setLoading(false);
        }
      } catch (error) {
        router.push("/");
        console.log(error);
      }
    };

    verifyToken();

    const handleBeforeUnload = () => {
      localStorage.removeItem("token");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token"); // トークンを削除
    router.back(); // 前のページにリダイレクト
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl font-bold text-blue-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 text-center">
        管理者ページ
      </h1>
      <div className="flex justify-end mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          ログアウト
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">
            NGワードの追加
          </h2>
          <AddNgWord />
        </div>
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">
            NGワードのインポート
          </h2>
          <ImportNgWords />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
