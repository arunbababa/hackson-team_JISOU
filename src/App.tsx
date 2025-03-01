import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainDashboard from './screens/MainDashboard';
import Question from './screens/Question';
import Settings from './screens/Settings';
import './App.css';
import alarmSound from './assets/alarm_1hour.mp3';

function App() {
  const alarmAudio = useRef(new Audio(alarmSound));

  const stopAlarm = () => {
    alarmAudio.current.pause();
    alarmAudio.current.currentTime = 0;
  };

  useEffect(() => {
    // ローカルストレージからアラーム設定を読み込む
    const loadAlarmSettings = () => {
      const settingsStr = localStorage.getItem('alarmSettings');
      if (!settingsStr) {
        // 初期設定がなければデフォルト値を設定
        const defaultSettings = {
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
        };
        localStorage.setItem('alarmSettings', JSON.stringify(defaultSettings));
      }
    };

    // ローカルストレージからアプリ設定を読み込む
    const loadAppSettings = () => {
      const settingsStr = localStorage.getItem('appSettings');
      if (!settingsStr) {
        // 初期設定がなければデフォルト値を設定
        const defaultSettings = {
          soundEnabled: true,
          vibrationEnabled: true,
          snoozeTime: 5,
          theme: 'light'
        };
        localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
      }
    };

    loadAlarmSettings();
    loadAppSettings();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard alarmAudio={alarmAudio} />} />
        <Route path="/question" element={<Question stopAlarm={stopAlarm} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;