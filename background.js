// Background script for Gemini API integration

// APIキーの設定（ユーザーがオプション画面で設定）
let GEMINI_API_KEY = '';

// ストレージからAPIキーを読み込み
chrome.storage.sync.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    GEMINI_API_KEY = result.geminiApiKey;
  }
});

// ストレージの変更を監視
chrome.storage.onChanged.addListener((changes) => {
  if (changes.geminiApiKey) {
    GEMINI_API_KEY = changes.geminiApiKey.newValue;
  }
});

// コンテンツスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'checkTextWithGemini') {
    checkTextWithGemini(request.text)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 非同期レスポンスを示す
  }
});

async function checkTextWithGemini(text) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
以下のテキストを分析し、Twitter/Xで投稿した場合の炎上リスクを評価してください。

テキスト: "${text}"

以下の基準で評価してください：
- safe: 炎上リスクが非常に低い
- caution: 炎上リスクがある程度存在する
- dangerous: 炎上リスクが高い

回答は以下のJSON形式で、警告メッセージジ100文字以内の短文でお願いします：
{
  "riskLevel": "safe|caution|dangerous",
  "warningMessage": "100文字以内の警告メッセージ"
}
`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      
      // JSONレスポンスを解析
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            riskLevel: result.riskLevel || 'safe',
            warningMessage: result.warningMessage || ''
          };
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
      }
      
      // JSONパースに失敗した場合のフォールバック
      if (text.includes('dangerous') || text.includes('危険')) {
        return {
          riskLevel: 'dangerous',
          warningMessage: '危険な内容です'
        };
      } else if (text.includes('caution') || text.includes('注意')) {
        return {
          riskLevel: 'caution',
          warningMessage: '表現に注意'
        };
      } else {
        return {
          riskLevel: 'safe',
          warningMessage: ''
        };
      }
    }
    
    throw new Error('Unexpected Gemini API response format');
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}