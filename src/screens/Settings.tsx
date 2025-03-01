// src/screens/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [snoozeTime, setSnoozeTime] = useState<number>(5);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // 設定を読み込む
  useEffect(() => {
    const loadSettings = () => {
      const settingsStr = localStorage.getItem('appSettings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        setSoundEnabled(settings.soundEnabled !== undefined ? settings.soundEnabled : true);
        setVibrationEnabled(settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true);
        setSnoozeTime(settings.snoozeTime || 5);
        setTheme(settings.theme || 'light');
      }
    };
    
    loadSettings();
  }, []);
  
  // 設定を保存する
  const saveSettings = () => {
    const settings = {
      soundEnabled,
      vibrationEnabled,
      snoozeTime,
      theme
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    // 保存完了メッセージやトーストを表示するなど
  };
  
  // サウンド設定を切り替え
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  // バイブレーション設定を切り替え
  const toggleVibration = () => {
    setVibrationEnabled(!vibrationEnabled);
  };
  
  // スヌーズ時間を更新
  const updateSnoozeTime = (time: number) => {
    setSnoozeTime(time);
  };
  
  // テーマを切り替え
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div className={`settings-screen ${theme}`}>
      <header className="settings-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← 戻る
        </button>
        <h1>設定</h1>
      </header>
      
      <div className="settings-container">
        <div className="setting-item">
          <div className="setting-label">
            <h3>アラーム音</h3>
            <p>アラーム時に音を鳴らす</p>
          </div>
          <div className="toggle-switch">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={soundEnabled} 
                onChange={toggleSound} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">
            <h3>バイブレーション</h3>
            <p>アラーム時に振動する</p>
          </div>
          <div className="toggle-switch">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={vibrationEnabled} 
                onChange={toggleVibration} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">
            <h3>スヌーズ時間</h3>
            <p>アラームを一時停止する時間（分）</p>
          </div>
          <div className="snooze-selector">
            <select 
              value={snoozeTime} 
              onChange={(e) => updateSnoozeTime(Number(e.target.value))}
            >
              <option value="1">1分</option>
              <option value="5">5分</option>
              <option value="10">10分</option>
              <option value="15">15分</option>
            </select>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">
            <h3>テーマ</h3>
            <p>アプリの見た目を切り替える</p>
          </div>
          <div className="theme-switch">
            <button 
              className={`theme-button ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              ライト
            </button>
            <button 
              className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              ダーク
            </button>
          </div>
        </div>
      </div>
      
      <div className="save-button-container">
        <button className="save-button" onClick={saveSettings}>
          設定を保存
        </button>
      </div>
      
      <nav className="navigation">
        <div className="nav-button" onClick={() => navigate('/')}>ホーム</div>
        <div className="nav-button active">設定</div>
      </nav>
    </div>
  );
};

export default Settings;