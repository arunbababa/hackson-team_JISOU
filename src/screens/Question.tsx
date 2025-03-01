import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question.css';

interface QuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
}

// Gemini API の型定義
interface GeminiResponse {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

const Question: React.FC = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 難易度を取得
  const getDifficulty = (): 'easy' | 'medium' | 'hard' => {
    const settingsStr = localStorage.getItem('alarmSettings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      return settings.difficulty || 'medium';
    }
    return 'medium';
  };
  
  // Gemini APIから問題を取得する関数
  const fetchQuestionFromGemini = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<QuestionData> => {
    try {
      // APIキーを直接設定するか、環境変数から取得する
      // 本番環境では、環境変数または設定ファイルを使用することを推奨
      const apiKey = 'AIzaSyDn-X2joQbgyZ0AvQ3lCkFv3ImmchNxAUo';
      
      if (!apiKey) {
        console.error('Gemini API key is not set');
        throw new Error('API key not configured');
      }
      
      // 難易度に応じたプロンプトを作成
      let prompt = '';
      switch (difficulty) {
        case 'easy':
          prompt = '簡単な一般常識クイズを1つ作成してください。小学生レベルの問題にしてください。';
          break;
        case 'medium':
          prompt = '中程度の難易度の一般常識クイズを1つ作成してください。中学生レベルの問題にしてください。';
          break;
        case 'hard':
          prompt = '難しい一般常識クイズを1つ作成してください。高校生以上のレベルの問題にしてください。';
          break;
      }
      
      // JSONフォーマットで返すようにプロンプトを追加
      prompt += `必ず以下のJSONフォーマットで回答してください。それ以外の説明や前置き、追加コメントは一切不要です：
      {
        "question": "問題文をここに書いてください",
        "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
        "correctAnswerIndex": 0
      }
      
      correctAnswerIndexは0から始まる配列のインデックスで、正解の選択肢の位置を示す数値（0, 1, 2, または 3）です。`;
      
      // Gemini APIにリクエスト（更新されたモデル名を使用）
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            topK: 40,
            topP: 0.95
          }
        })
      });
      
      if (!response.ok) {
        console.error('API Response Status:', response.status);
        console.error('API Response Text:', await response.text());
        throw new Error(`Failed to fetch from Gemini API: ${response.status}`);
      }
      
      const data = await response.json();
      
      // APIからのレスポンスからJSONを抽出
      console.log('Gemini API response:', data);
      
      let geminiData: GeminiResponse;
      
      try {
        // レスポンス構造を確認
        console.log('Raw API response:', JSON.stringify(data));
        
        let textContent = '';
        
        // 新しいAPIレスポンス形式への対応
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
          // テキスト部分を抽出
          if (data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
            textContent = data.candidates[0].content.parts[0].text || '';
          }
        }
        
        console.log('Extracted text:', textContent);
        
        // JSONの部分を抽出
        let jsonMatch = textContent.match(/\{[\s\S]*\}/);
        
        // JSONが見つからない場合、テキスト全体をJSONとして解析を試みる
        if (!jsonMatch && textContent.trim().startsWith('{') && textContent.trim().endsWith('}')) {
          jsonMatch = [textContent.trim()];
        }
        
        if (!jsonMatch) {
          throw new Error('Could not extract JSON from response: ' + textContent);
        }
        
        console.log('Extracted JSON:', jsonMatch[0]);
        geminiData = JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error('Error parsing API response:', error);
        console.error('API response structure:', data);
        
        // フォールバック：エラー時はダミーデータを使用
        geminiData = {
          question: 'APIからのデータ取得に失敗しました。1 + 1 = ?',
          options: ['2', '3', '4', '5'],
          correctAnswerIndex: 0
        };
      }
      
      // アプリの形式に変換して返す
      return {
        question: geminiData.question,
        options: geminiData.options,
        correctAnswer: geminiData.correctAnswerIndex
      };
    } catch (error) {
      console.error('Error fetching question from Gemini API:', error);
      
      // エラー時のフォールバック問題
      return {
        question: 'APIエラーが発生しました。次の問題に答えてください：1 + 1 = ?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 0
      };
    }
  };
  
  // 問題を生成する
  useEffect(() => {
    const fetchQuestion = async () => {
      setIsLoading(true);
      const difficulty = getDifficulty();
      
      try {
        const newQuestion = await fetchQuestionFromGemini(difficulty);
        setQuestion(newQuestion);
      } catch (error) {
        console.error('Error setting up question:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestion();
    
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
    }
  };
  
  // アラームを停止
  const handleStopAlarm = () => {
    navigate('/');
  };
  
  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }
  
  if (!question) {
    return <div className="error">問題の読み込みに失敗しました。</div>;
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