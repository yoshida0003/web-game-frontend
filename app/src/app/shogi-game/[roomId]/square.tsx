import { useDrop } from "react-dnd";
import Piece from "./piece";

interface SquareProps {
	x: number;
	y: number;
	piece: string | null;
	isFirstPlayer: boolean;
	movePiece: (fromX: number, fromY: number, toX: number, toY: number) => void;
}

const Square: React.FC<SquareProps> = ({ x, y, piece, isFirstPlayer, movePiece }) => {
	const [{ isOver }, drop] = useDrop({
		accept: "PIECE",
		drop: (item: { x: number; y: number; piece: string }) => {
			let { x: fromX, y: fromY } = item;
			let targetX = x;
			let targetY = y;

			// 後手の盤面は座標を反転
			if (!isFirstPlayer) {
				fromX = 8 - fromX;
				fromY = 8 - fromY;
				targetX = 8 - x;
				targetY = 8 - y;
			}

			console.log(`🎯 ドロップ: (${fromX},${fromY}) → (${targetX},${targetY})`);
			movePiece(fromX, fromY, targetX, targetY);
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	});

	return (
		<div
			ref={drop as unknown as React.Ref<HTMLDivElement>}
			className={`flex items-center justify-center border border-gray-700 w-16 h-16 ${isOver ? "bg-blue-300" : ""
				}`}
		>
			{piece && <Piece piece={piece} x={x} y={y} isSecondPlayer={!isFirstPlayer} isFirstPlayer={isFirstPlayer} />}
		</div>
	);
};

export default Square;
