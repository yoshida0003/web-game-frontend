import Link from "next/link";

export default function Home() {
  return (
		<div className="grid row-span-1">
      <p><Link href="/shogi">将棋ページ</Link></p>
			<p><Link href="./ng-word">NGワードゲーム</Link></p>
      <p><Link href="./Auth">認証</Link></p>
    </div>
  );
}
