import React from "react";
import axios from "axios";
import Button from "@/components/Button";

interface TimerSettingsProps {
  roomId: string;
  userId: string;
  timerDuration: number;
  onTimerUpdate: (duration: number) => void; // 親コンポーネントでタイマーを更新する関数
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  roomId,
  userId,
  timerDuration,
  onTimerUpdate,
}) => {
  const durations = [10, 300, 480, 600, 900, 1800]; // 秒単位の時間設定

  const handleSetTimer = async (duration: number) => {
    try {
      await axios.post("http://localhost:3001/api/set-timer", {
        roomId,
        userId,
        timerDuration: duration,
      });
      onTimerUpdate(duration); // 親コンポーネントに新しいタイマー値を通知
    } catch (error) {
      console.error("時間設定エラー:", error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">時間を設定:</h3>
      <div className="flex gap-2">
        {durations.map((duration) => (
          <Button
            key={duration}
            onClick={() => handleSetTimer(duration)}
            className={
              timerDuration === duration
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
            }
          >
            {duration / 60}分
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TimerSettings;
