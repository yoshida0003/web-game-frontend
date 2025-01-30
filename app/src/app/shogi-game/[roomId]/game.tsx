import { useState, useEffect } from "react";
import axios from "axios";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import io from "socket.io-client";

const socket = io("http://localhost:3001", {
	withCredentials: true,
	transports: ["websocket", "polling"],
});

interface GamePageProps {
	board: (string | null)[][];
	roomId: string;
	userId: string;
	isFirstPlayer: boolean;
	logs: string[];
	currentPlayer: string | null;
}

const GamePage: React.FC<GamePageProps> = ({
	board: initialBoard,
	roomId,
	userId,
	isFirstPlayer,
	logs: initialLogs,
	currentPlayer: initialCurrentPlayer,
}) => {
	const [board, setBoard] = useState(initialBoard);
	const [logs, setLogs] = useState(initialLogs);
	const [currentPlayer, setCurrentPlayer] = useState(initialCurrentPlayer);

	// 盤面のラベル（先手・後手で異なる）["1", "2", "3", "4", "5", "6", "7", "8", "9"]
	const rowLabels = isFirstPlayer ? ["一", "二", "三", "四", "五", "六", "七", "八", "九"] : ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
	const colLabels = isFirstPlayer ? ["9", "8", "7", "6", "5", "4", "3", "2", "1"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

	// 駒の座標を将棋の座標（4五など）に変換
	const getPositionNotation = (x: number, y: number): string => {
		return `${rowLabels[x]}${colLabels[y]}`;
	};

	// クライアント側で盤面を更新
	useEffect(() => {
		socket.on("update-board", ({ board, currentPlayer, logs }) => {
			console.log("📥 クライアントが update-board を受信: ", { board, currentPlayer, logs });
			setBoard([...board]); // ✅ 盤面を更新
			setCurrentPlayer(currentPlayer); // ✅ ターンを更新
			setLogs([...logs]); // ✅ ログも更新
		});

		return () => {
			socket.off("update-board");
		};
	}, [socket]);

	// 駒の移動リクエスト
	const movePiece = async (fromX: number, fromY: number, toX: number, toY: number) => {
		if (currentPlayer !== userId) {
			alert("相手のターンです！");
			return;
		}

		const notation = getPositionNotation(toX, toY);

		try {
			console.log(`🚀 movePiece: ${fromX},${fromY} -> ${toX},${toY}`);
			const response = await axios.post("http://localhost:3001/api/shogi/move-piece", {
				roomId,
				userId,
				fromX,
				fromY,
				toX,
				toY,
				notation,
			});
			console.log("✅ movePiece API レスポンス:", response.data);

			if (response.data.board) {
				setBoard([...response.data.board]);
				setLogs([...response.data.logs]);
				setCurrentPlayer(response.data.currentPlayer);
			}
		} catch (error) {
			console.error("❌ movePiece エラー:", error);
		}
	};

	// 駒のコンポーネント
	const Piece: React.FC<{ piece: string; x: number; y: number }> = ({ piece, x, y }) => {
		const [{ isDragging }, drag] = useDrag({
			type: "PIECE",
			item: { x, y, piece },
			collect: (monitor) => ({
				isDragging: !!monitor.isDragging(),
			}),
		});

		return (
			<div ref={drag as unknown as React.Ref<HTMLDivElement>} className={`cursor-grab ${isDragging ? "opacity-50" : ""}`}>
				<span className={piece === "P" ? "text-black" : "text-red-500"}>
					{piece === "P" ? "先歩" : "後歩"}
				</span>
			</div>
		);
	};

	// マスのコンポーネント
	const Square: React.FC<{ x: number; y: number; piece: string | null }> = ({ x, y, piece }) => {
		const [{ isOver }, drop] = useDrop({
			accept: "PIECE",
			drop: (item: { x: number; y: number; piece: string }) => {
				const { x: fromX, y: fromY } = item;
				const forwardX = isFirstPlayer ? fromX - 1 : fromX + 1;

				if (x === forwardX && y === fromY) {
					movePiece(fromX, fromY, x, y);
				}
			},
			collect: (monitor) => ({
				isOver: !!monitor.isOver(),
			}),
		});

		return (
			<div ref={drop as unknown as React.Ref<HTMLDivElement>} className={`flex items-center justify-center border border-gray-700 w-full h-full ${isOver ? "bg-blue-300" : ""}`}>
				{piece && <Piece piece={piece} x={x} y={y} />}
			</div>
		);
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="flex items-center">
				<div>
					{/* 行番号 (縦) */}
					<div className="flex ">
						{colLabels.map((col, index) => (
							<div key={`col-${index}`} className="w-16 h-8 flex items-center justify-center">
								{col}
							</div>
						))}
					</div>

					{/* 盤面 */}
					<div className="flex">
						<div className="grid grid-cols-9 border border-gray-700" style={{ backgroundColor: "#F9C270", width: "36rem", height: "36rem" }}>
							{board.map((row, rowIndex) =>
								row.map((cell, colIndex) => (
									<Square key={`${rowIndex}-${colIndex}`} x={rowIndex} y={colIndex} piece={cell} />
								))
							)}
						</div>
						<div className="flex flex-col">
							{rowLabels.map((row, index) => (
								<div key={`row-${index}`} className="w-8 h-16 flex items-center justify-center">
									{row}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ログエリア */}
				<div className="ml-4">
					<h3 className="mt-4">{currentPlayer === userId ? "あなたのターンです" : "相手のターンです"}</h3>
					<h3>ログ</h3>
					<ul>
						{logs.map((log, index) => (
							<li key={`${log}-${index}`}>{log}</li>
						))}
					</ul>
				</div>
			</div>
		</DndProvider>
	);
};

export default GamePage;