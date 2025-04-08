"use client";
import { useState } from "react";

const AddNgWord = () => {
  const [word, setWord] = useState("");

  interface NgWord {
    word: string;
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const response = await fetch("https://game.yospace.org/api/addNgWord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify({ word } as NgWord),
    });

    if (response.ok) {
      alert("NGワードを追加しました。");
      setWord(""); // フォームをリセット
    } else {
      alert("NGワードの追加に失敗しました");
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-700">NGワードの追加</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            ワード：
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          追加
        </button>
      </form>
    </div>
  );
};

export default AddNgWord;
