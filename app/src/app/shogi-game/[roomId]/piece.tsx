import { useDrag } from "react-dnd";

interface PieceProps {
  piece: string;
  x: number;
  y: number;
  isSecondPlayer: boolean;
  isFirstPlayer: boolean; // 現在のプレイヤーが先手かどうか
}

const Piece: React.FC<PieceProps> = ({
  piece,
  x,
  y,
  isSecondPlayer,
  isFirstPlayer,
}) => {
  const isFirstPlayerPiece = piece === piece.toUpperCase();
  const isOwnPiece =
    (isFirstPlayer && isFirstPlayerPiece) ||
    (!isFirstPlayer && !isFirstPlayerPiece);

  const [{ isDragging }, drag] = useDrag({
    type: "PIECE",
    item: { x, y, piece },
    canDrag: isOwnPiece, // 自分の駒のみドラッグ可能
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
    PK: "prom-knight",
    pk: "prom-knight",
    PL: "prom-lance",
    Pl: "prom-lance",
  };

  const pieceType = pieceTypeMap[piece];

  const player = isSecondPlayer
    ? isFirstPlayerPiece
      ? "second"
      : "first"
    : isFirstPlayerPiece
    ? "first"
    : "second";

  const pieceImage = `/image/${player}-${pieceType}.png`;

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`cursor-grab ${isDragging ? "opacity-50" : ""}`}
    >
      <img src={pieceImage} alt={pieceType} className="w-8 h-8" />
    </div>
  );
};

export default Piece;
