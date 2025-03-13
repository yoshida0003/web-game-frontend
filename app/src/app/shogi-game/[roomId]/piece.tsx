import { useDrag } from "react-dnd";

interface PieceProps {
  piece: string;
  x: number;
  y: number;
  isFirstPlayer: boolean;
  fromCaptured?: boolean;
  capturedIndex?: number;
  isOwner?: boolean;
  playerSide: "first" | "second"; // ✅ 所有者情報を明示
}

const Piece: React.FC<PieceProps> = ({
  piece,
  x,
  y,
  isFirstPlayer,
  fromCaptured = false,
  capturedIndex,
  isOwner,
  playerSide,
}) => {
  const isOwnPiece = fromCaptured
    ? isOwner
    : isFirstPlayer === (playerSide === "first"); // ✅ 自分の駒台または自分の駒のみドラッグ可能

  const [{ isDragging }, drag] = useDrag({
    type: "PIECE",
    item: { x, y, piece, fromCaptured, capturedIndex, playerSide },
    canDrag: isOwnPiece,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const pieceTypeMap: { [key: string]: string } = {
    P: "pawn",
    p: "pawn",
    K: "king",
    k: "king",
    R: "rook",
    r: "rook",
    B: "bishop",
    b: "bishop",
    G: "gold",
    g: "gold",
    S: "silver",
    s: "silver",
    N: "knight",
    n: "knight",
    L: "lance",
    l: "lance",
    PP: "prom-pawn",
    pp: "prom-pawn",
    PR: "prom-rook",
    pr: "prom-rook",
    PB: "prom-bishop",
    pb: "prom-bishop",
    PS: "prom-silver",
    ps: "prom-silver",
    PN: "prom-knight",
    pn: "prom-knight",
    PL: "prom-lance",
    pl: "prom-lance",
  };

  const pieceType = pieceTypeMap[piece];

  if (!pieceType) {
    console.error(`未定義の駒タイプ: ${piece}`);
    return null;
  }

  const pieceImage = `/image/${playerSide}-${pieceType}.png`;

  // ✅ 後手視点なら 180° 回転させる
  const isFlipped = !isFirstPlayer;

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`relative z-0 cursor-grab ${isDragging ? "opacity-50" : ""} ${
        isFlipped ? "rotate-180" : ""
      } z-10`} // ✅ 後手視点なら 180° 回転
    >
      <img src={pieceImage} alt={pieceType} className="w-8 h-8" />
    </div>
  );
};

export default Piece;
