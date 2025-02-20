import React from "react";
import Piece from "./piece";

interface CapturedPiecesProps {
	capturedPieces: { piece: string; owner: "first" | "second" }[];
	isFirstPlayer: boolean;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({
	capturedPieces,
	isFirstPlayer,
}) => {
	return (
		<div className="grid grid-cols-3 gap-2">
			{capturedPieces.map(({ piece, owner }, index) => (
				<div
					key={`${owner}-${index}`}
					className={`w-8 h-8 flex items-center justify-center border border-gray-700 ${owner === "first" ? "bg-blue-200" : "bg-red-200"
						}`}
				>
					<Piece
						piece={piece}
						x={0}
						y={0}
						isSecondPlayer={isFirstPlayer ? owner === "second" : owner === "first"} // 駒の所有者に基づいて向きを設定
						isFirstPlayer={isFirstPlayer ? owner === "first" : owner === "second"} // 駒の所有者に基づいて向きを設定
						fromCaptured={true} // 駒台からの駒であることを示す
						capturedIndex={index} // 駒台のインデックス
					/>
				</div>
			))}
		</div>
	);
};

export default CapturedPieces;