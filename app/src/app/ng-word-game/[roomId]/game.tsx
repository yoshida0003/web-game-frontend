import React from 'react';

interface User {
  id: string;
  username: string;
}

interface GameProps {
  users: User[];
}

const Game: React.FC<GameProps> = ({ users }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ゲーム中</h1>
      <h3 className="text-lg mb-4">参加者:</h3>
      <ul className="list-disc pl-5">
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Game;
