import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question.css';

interface QuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
}

const Question: React.FC<{ stopAlarm: () => void }> = ({ stopAlarm }) => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // 難易度を取得
  const getDifficulty = (): 'easy' | 'medium' | 'hard' => {
    const settingsStr = localStorage.getItem('alarmSettings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      return settings.difficulty || 'medium';
    }
    return 'medium';
  };

  // 問題を生成する
  useEffect(() => {
    const difficulty = getDifficulty();

    // 難易度に応じた問題の生成
    // 実際のプロダクションでは、ここでAPIからデータを取得するか、
    // より複雑なロジックで問題を生成します
    let newQuestion: QuestionData;

    if (difficulty === 'easy') {
      newQuestion = {
        question: '次のうち、日本の首都はどれですか？',
        options: ['大阪', '京都', '東京', '名古屋'],
        correctAnswer: 2
      };
    } else if (difficulty === 'medium') {
      newQuestion = {
        question: '二次方程式 x² - 5x + 6 = 0 の解は？',
        options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = -1, x = -6'],
        correctAnswer: 0
      };
    } else {
      newQuestion = {
        question: '次の英文の間違いを指摘してください： "He have been working here for three years."',
        options: [
          '"He" が間違い、"They" が正しい',
          '"have" が間違い、"has" が正しい',
          '"working" が間違い、"worked" が正しい',
          '"years" が間違い、"year" が正しい'
        ],
        correctAnswer: 1
      };
    }

    setQuestion(newQuestion);

    // タイマー開始
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 時間切れ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 回答を選択
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    if (question && index === question.correctAnswer) {
      setIsCorrect(true);
      stopAlarm(); // 正解したらアラームを停止
    }
  };

  // アラームを停止
  const handleStopAlarm = () => {
    navigate('/');
  };

  if (!question) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="question-screen">
      <div className="timer">
        残り時間: {timeLeft}秒
      </div>

      <div className="question-container">
        <h2>朝の問題</h2>
        <p className="question-text">{question.question}</p>

        <div className="options-container">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`option ${selectedOption === index ? (isCorrect && index === question.correctAnswer ? 'correct' : 'incorrect') : ''}`}
              onClick={() => handleSelectOption(index)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      {isAnswered && (
        <div className="result-message">
          {isCorrect ? (
            <div className="correct-message">
              <h3>正解です！</h3>
              <button className="stop-button" onClick={handleStopAlarm}>
                アラームを停止する
              </button>
            </div>
          ) : (
            <div className="incorrect-message">
              <h3>不正解です。もう一度挑戦してください。</h3>
              <button
                className="retry-button"
                onClick={() => {
                  setIsAnswered(false);
                  setSelectedOption(null);
                }}
              >
                再挑戦
              </button>
            </div>
          )}
        </div>
      )}

      {timeLeft === 0 && !isAnswered && (
        <div className="timeout-message">
          <h3>時間切れです。もう一度挑戦してください。</h3>
          <button
            className="retry-button"
            onClick={() => {
              setTimeLeft(60);
              setIsAnswered(false);
              setSelectedOption(null);
            }}
          >
            再挑戦
          </button>
        </div>
      )}
    </div>
  );
};

export default Question;