const RuleGuide = () => {
  return (
    <div className="bg-FAF9FB p-8 w-full md:w-3/4 xl:w-2/3 mx-auto rounded-xl shadow-lg">
      <h3 className="mb-4 text-2xl md:text-3xl text-center font-bold fc-2EB1F0">
        ゲームルール
      </h3>
      <div className="fc-6B8AA0 font-bold text-sm md:text-lg xl:text-xl leading-relaxed mx-auto">
        <p className="mb-4">① 制限時間内で会話をしてください。</p>
        <p className="mb-4">
          ② 相手がNGワードを言ったら、相手のカードをクリックしてください。
          その相手に+1ポイントが加算されます。
        </p>
        <p className="mb-4">
          ③ クリックされたプレイヤーには新しいNGワードが割り当てられます。
        </p>
        <p>④ 最もポイントが少ない人が勝利です。（同点なら引き分け）</p>
      </div>
    </div>
  );
};

export default RuleGuide;
