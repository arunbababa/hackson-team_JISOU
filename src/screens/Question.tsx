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

// ローカルの問題バンク（フォールバック用）
const fallbackQuestions: QuestionData[] = [
  {
    question: '日本の首都はどこですか？',
    options: ['東京', '大阪', '京都', '札幌'],
    correctAnswer: 0
  },
  {
    question: '水の化学式は何ですか？',
    options: ['H2O', 'CO2', 'O2', 'NaCl'],
    correctAnswer: 0
  },
  {
    question: '地球から一番近い惑星はどれですか？',
    options: ['水星', '金星', '火星', '木星'],
    correctAnswer: 1
  },
  {
    question: '1日は何時間ですか？',
    options: ['12時間', '24時間', '48時間', '36時間'],
    correctAnswer: 1
  },
  {
    question: '人間の体で一番大きな臓器は何ですか？',
    options: ['心臓', '脳', '肝臓', '皮膚'],
    correctAnswer: 3
  },
  {
    question: '日本で一番高い山は？',
    options: ['富士山', '北岳', '奥穂高岳', '御嶽山'],
    correctAnswer: 0
  },
  {
    question: 'サッカーの試合で、通常フィールドに出る選手は1チーム何人ですか？',
    options: ['9人', '10人', '11人', '12人'],
    correctAnswer: 2
  },
  {
    question: '「白夜」が見られる地域として正しいのは？',
    options: ['赤道付近', '北極・南極付近', '砂漠地帯', '熱帯雨林'],
    correctAnswer: 1
  },
  {
    question: '次の中で哺乳類ではないのはどれ？',
    options: ['イルカ', 'コウモリ', 'ペンギン', 'カモノハシ'],
    correctAnswer: 2
  },
  {
    question: 'カレーライスの主な香辛料であるターメリックの色は？',
    options: ['赤色', '黄色', '緑色', '黒色'],
    correctAnswer: 1
  },
  {
    question: 'パソコンのキーボードの「Ctrl」キーは何の略？',
    options: ['Control', 'Center', 'Correct', 'Counter'],
    correctAnswer: 0
  },
  {
    question: '世界三大料理とされているのは、フランス料理、中華料理と何？',
    options: ['イタリア料理', 'スペイン料理', 'トルコ料理', 'タイ料理'],
    correctAnswer: 0
  },
  {
    question: '次のうち、ノーベル賞がないのはどの分野？',
    options: ['物理学', '医学・生理学', '化学', '数学'],
    correctAnswer: 3
  },
  {
    question: '体温計の水銀が銀色なのはなぜ？',
    options: ['水銀自体が銀色', '水銀に銀が混ざっている', '光の反射で銀色に見える', '銀色の容器に入っている'],
    correctAnswer: 0
  },
  {
    question: '春分の日と秋分の日は何によって定められる？',
    options: ['月の満ち欠け', '太陽の位置', '潮の満ち引き', '気温の変化'],
    correctAnswer: 1
  }
];

const Question: React.FC = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApiTimedOut, setIsApiTimedOut] = useState<boolean>(false);
  
  // 難易度を取得
  const getDifficulty = (): 'easy' | 'medium' | 'hard' => {
    const settingsStr = localStorage.getItem('alarmSettings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      return settings.difficulty || 'medium';
    }
    return 'medium';
  };

  // ランダムな問題をフォールバック問題から取得
  const getRandomFallbackQuestion = (): QuestionData => {
    const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
    return fallbackQuestions[randomIndex];
  };
  
  // 以前に出題した問題を保存するためのキー
  const PREVIOUS_QUESTIONS_KEY = 'previousQuestions';
  
  // 以前に出題した問題を取得する関数
  const getPreviousQuestions = (): string[] => {
    const stored = localStorage.getItem(PREVIOUS_QUESTIONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing previous questions:', e);
        return [];
      }
    }
    return [];
  };
  
  // 新しい問題を保存する関数
  const saveQuestion = (question: string) => {
    const previousQuestions = getPreviousQuestions();
    // 最大20個の問題を保存（古いものから削除）
    if (previousQuestions.length >= 20) {
      previousQuestions.shift();
    }
    previousQuestions.push(question);
    localStorage.setItem(PREVIOUS_QUESTIONS_KEY, JSON.stringify(previousQuestions));
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
      
      // 以前に出題した問題を取得
      const previousQuestions = getPreviousQuestions();
      
      // カテゴリーの配列を定義
      const categories = [
        '科学（物理）', '科学（化学）', '科学（生物）', '科学（天文）', 
        '歴史（日本）', '歴史（世界）', '地理（日本）', '地理（世界）', 
        '言語・文学', '芸術', '音楽', 'スポーツ', '数学', '一般教養',
        '食べ物と料理', '健康と医学', '植物と動物', '国旗と国', '言葉の意味',
        'ことわざ', '有名な発明', '世界の文化', '有名な観光地', '自然現象'
      ];
      
      // ランダムにカテゴリーを選択
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];
      
      // 現在の日付を取得し、日付シードを作成
      const today = new Date();
      const dateSeed = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      
      // 難易度に応じたプロンプトを作成
      let prompt = '';
      switch (difficulty) {
        case 'easy':
          prompt = `朝起きたばかりの人が解くための、簡単で面白い一般常識クイズを1つ作成してください。朝の脳を活性化させ、スッキリ目覚めるのに役立つような問題にしてください。小学生レベルの難易度で、ポジティブな気持ちになれる内容が望ましいです。

特に「${selectedCategory}」に関する問題を作成してください。日付シード「${dateSeed}」に基づいた問題を作成してください。`;
          break;
        case 'medium':
          prompt = `朝起きたばかりの人が解くための、適度な難易度で考えさせる一般常識クイズを1つ作成してください。朝の脳を活性化させ、スッキリ目覚めるのに役立つような問題にしてください。中学生レベルの難易度で、知的好奇心を刺激する内容が望ましいです。

特に「${selectedCategory}」に関する問題を作成してください。日付シード「${dateSeed}」に基づいた問題を作成してください。`;
          break;
        case 'hard':
          prompt = `朝起きたばかりの人が解くための、やや難しい一般常識クイズを1つ作成してください。朝の脳を完全に活性化させ、スッキリ目覚めるのに役立つような問題にしてください。高校生以上レベルの難易度で、考えがいのある内容が望ましいです。

特に「${selectedCategory}」に関する問題を作成してください。日付シード「${dateSeed}」に基づいた問題を作成してください。`;
          break;
      }
      
      // 以前の問題を避けるための指示を追加
      if (previousQuestions.length > 0) {
        prompt += `

以下の問題は最近出題したものなので、同じ問題や似た問題は避けてください。
${previousQuestions.map(q => `- ${q}`).join('\n')}`;
      }
      
      // JSONフォーマットで返すようにプロンプトを追加
      prompt += `

必ず以下のJSONフォーマットで回答してください。それ以外の説明や前置き、追加コメントは一切不要です：
{
  "question": "問題文をここに書いてください",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctAnswerIndex": 0
}

correctAnswerIndexは0から始まる配列のインデックスで、正解の選択肢の位置を示す数値（0, 1, 2, または 3）です。
選択肢は明確に異なるものにし、曖昧さがないようにしてください。
正解の選択肢のインデックスはランダムに選んでください（常に0にしないこと）。
${selectedCategory}に関連する面白くて教育的な問題を作ってください。`;
      
      // API リクエストにタイムアウトを設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でタイムアウト
      
      try {
        // セッション固有のリクエストIDを生成
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Gemini APIにリクエスト（更新されたモデル名を使用）
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
              temperature: 0.7, // より多様な回答を得るため温度を上げる
              maxOutputTokens: 1024,
              topK: 40,
              topP: 0.95
            },
            // リクエストごとに一意のキーを追加して、キャッシュの影響を避ける
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              }
            ]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
          // JSON解析エラーの場合はフォールバック問題を使用
          return getRandomFallbackQuestion();
        }
        
        // 新しい問題を保存
        saveQuestion(geminiData.question);
        
        // アプリの形式に変換して返す
        return {
          question: geminiData.question,
          options: geminiData.options,
          correctAnswer: geminiData.correctAnswerIndex
        };
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.error('API request timed out');
          setIsApiTimedOut(true);
          // タイムアウトの場合はフォールバック問題を使用
          return getRandomFallbackQuestion();
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching question from Gemini API:', error);
      // エラー時のフォールバック問題
      return getRandomFallbackQuestion();
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
        // APIエラー時にはフォールバック問題を使用
        setQuestion(getRandomFallbackQuestion());
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
    return (
      <div className="loading-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>朝の問題を準備中...</p>
          <p className="loading-message">目が覚めるような問題を選んでいます</p>
        </div>
      </div>
    );
  }
  
  if (!question) {
    return <div className="error">問題の読み込みに失敗しました。再読み込みしてください。</div>;
  }
  
  return (
    <div className="question-screen">
      <div className="timer">
        残り時間: {timeLeft}秒
      </div>
      
      <div className="question-container">
        <h2>朝の問題</h2>
        {isApiTimedOut && <p className="api-notice">※オフライン問題を表示しています</p>}
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
              <h3>正解です！素晴らしい！</h3>
              <p>今日も良い一日になりますように！</p>
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