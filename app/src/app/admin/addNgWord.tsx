"use client";
import { useState } from "react";

const AddNgWord = () => {
  const [word, setWord] = useState('');

  interface NgWord {
    word: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const response = await fetch("https://game.yospace.org/api/addNgWord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token || '',
      },
      body: JSON.stringify({ word } as NgWord),
    });

    if (response.ok) {
      alert('NGワードを追加しました。');
    } else {
      alert('NGワードの追加に失敗しました');
    }
  };

  return (
    <div>
      <h1>NGワードの追加</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ワード：</label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            required
          />
        </div>
        <button type="submit">追加</button>
      </form>
    </div>
  );
}

export default AddNgWord;