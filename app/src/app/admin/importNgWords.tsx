import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

interface CsvRow {
  id: string; // 一意の識別子を含むカラム名
  [key: string]: string;
}

const ImportNgWords = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ngWords, setNgWords] = useState<CsvRow[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = () => {
    if (file) {
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("Parsed CSV data:", results.data); // ログ出力

          // CSVの最初の行のキーを取得
          const firstRow = results.data[0];
          if (!firstRow) {
            alert("CSVが空です");
            return;
          }

          const columnName = Object.keys(firstRow)[0]; // 最初のカラム名を取得
          console.log("Detected column name:", columnName);

          const words = results.data.map((row) => ({
            id: row.id, // 一意の識別子を使用
            word: row[columnName],
          }));
          console.log("Extracted words:", words); // 取得した単語リストをログ出力

          setNgWords(words);
          setShowModal(true);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
        },
      });
    }
  };

  const handleConfirm = async () => {
    try {
      const token = localStorage.getItem("token"); // ローカルストレージからトークンを取得
      if (!token) {
        alert("認証トークンが見つかりません。ログインしてください。");
        return;
      }

      await axios.post(

        "https://game.yospace.org/api/importNgWords",
        { ngWords },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "", // トークンをヘッダーに追加
          },
        }
      );
      alert("NGワードが追加されました");
      setShowModal(false);
      setFile(null);
      setNgWords([]);
    } catch (error) {
      console.error("Error importing NG words:", error);
      alert("NGワードのインポート中にエラーが発生しました");
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setFile(null);
    setNgWords([]);
  };

  return (
    <div className="container mx-auto p-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleFileUpload}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        追加
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/2">
            <h2 className="text-xl font-bold mb-4">
              追加するNGワードを確認してください
            </h2>
            <SimpleBar style={{ maxHeight: 300 }}>
              <ul className="list-disc pl-5 mb-4">
                {ngWords.map((word) => (
                  <li key={word.id}>{word.word}</li>
                ))}
              </ul>
            </SimpleBar>
            <div className="flex justify-end">
              <button
                onClick={handleConfirm}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
              >
                確定
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportNgWords;
