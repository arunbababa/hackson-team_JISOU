// src/screens/MainDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainDashboard.css';
import alarmSound from '../assets/alarm.mp3'; // 追加

// 型定義
interface AlarmSettings {
  time: string;
  isEnabled: boolean;
  days: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

const MainDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>({
    time: '06:30',
    isEnabled: true,
    days: {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
      sun: false,
    },
    difficulty: 'medium',
  });
  const alarmAudio = useRef(new Audio(alarmSound)); // 追加
  
  // 時間を更新する効果
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
      
      // アラームチェック
      checkAlarm(now);
    };
    
    // 初期時間設定
    updateTime();
    
    // 1秒ごとに時間を更新
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, [alarmSettings]);
  
  // アラームをチェックする関数
  const checkAlarm = (now: Date) => {
    if (!alarmSettings.isEnabled) return;
    
    const dayMap: {[key: number]: keyof typeof alarmSettings.days} = {
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat',
      0: 'sun',
    };
    
    const today = dayMap[now.getDay()];
    if (!alarmSettings.days[today]) return;
    
    const [alarmHours, alarmMinutes] = alarmSettings.time.split(':').map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHours === alarmHours && currentMinutes === alarmMinutes) {
      // アラーム時間になったら音を再生し、問題画面に遷移
      alarmAudio.current.play(); // 追加
      navigate('/question');
    }
  };
  
  // アラーム時間を更新
  const updateAlarmTime = (time: string) => {
    setAlarmSettings(prev => ({ ...prev, time }));
    // ローカルストレージに保存
    localStorage.setItem('alarmSettings', JSON.stringify({...alarmSettings, time}));
  };
  
  // アラームのオン/オフを切り替え
  const toggleAlarm = () => {
    const newSettings = {...alarmSettings, isEnabled: !alarmSettings.isEnabled};
    setAlarmSettings(newSettings);
    localStorage.setItem('alarmSettings', JSON.stringify(newSettings));
  };
  
  // 曜日選択を更新
  const updateDay = (day: keyof typeof alarmSettings.days) => {
    const newDays = {...alarmSettings.days, [day]: !alarmSettings.days[day]};
    const newSettings = {...alarmSettings, days: newDays};
    setAlarmSettings(newSettings);
    localStorage.setItem('alarmSettings', JSON.stringify(newSettings));
  };
  
  // 難易度を更新
  const updateDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    const newSettings = {...alarmSettings, difficulty};
    setAlarmSettings(newSettings);
    localStorage.setItem('alarmSettings', JSON.stringify(newSettings));
  };
  
  return (
    <div className="main-dashboard">
      <header className="header">
        <h1>AI朝問題アラーム</h1>
      </header>
      
      <div className="clock-container">
        <div className="time">{currentTime}</div>
        <div className="time-label">現在時刻</div>
      </div>
      
      <div className="alarm-settings">
        <h2>アラーム設定</h2>
        <div className="time-setting">
          <input 
            type="time" 
            value={alarmSettings.time} 
            onChange={(e) => updateAlarmTime(e.target.value)} 
            className="time-input"
          />
          <div className="toggle-switch">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={alarmSettings.isEnabled} 
                onChange={toggleAlarm} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="days-selection">
        <h2>曜日</h2>
        <div className="days-container">
          {Object.entries(alarmSettings.days).map(([day, isSelected]) => {
            const dayLabel = {
              mon: '月', tue: '火', wed: '水', thu: '木',
              fri: '金', sat: '土', sun: '日'
            }[day as keyof typeof alarmSettings.days];
            
            return (
              <div 
                key={day} 
                className={`day-button ${isSelected ? 'selected' : ''}`}
                onClick={() => updateDay(day as keyof typeof alarmSettings.days)}
              >
                {dayLabel}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="difficulty-selection">
        <h2>問題難易度</h2>
        <div className="difficulty-buttons">
          <button 
            className={`difficulty-button ${alarmSettings.difficulty === 'easy' ? 'selected' : ''}`}
            onClick={() => updateDifficulty('easy')}
          >
            易しい
          </button>
          <button 
            className={`difficulty-button ${alarmSettings.difficulty === 'medium' ? 'selected' : ''}`}
            onClick={() => updateDifficulty('medium')}
          >
            普通
          </button>
          <button 
            className={`difficulty-button ${alarmSettings.difficulty === 'hard' ? 'selected' : ''}`}
            onClick={() => updateDifficulty('hard')}
          >
            難しい
          </button>
        </div>
      </div>
      
      <nav className="navigation">
        <div className="nav-button active">ホーム</div>
        <div className="nav-button" onClick={() => navigate('/settings')}>設定</div>
      </nav>
    </div>
  );
};

export default MainDashboard;