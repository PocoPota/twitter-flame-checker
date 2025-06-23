// Options page script for API key management

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('optionsForm');
    const apiKeyInput = document.getElementById('apiKey');
    const testButton = document.getElementById('testButton');
    const statusDiv = document.getElementById('status');

    // 保存されたAPIキーを読み込み
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
    });

    // フォーム送信時の処理
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const apiKey = apiKeyInput.value.trim();
        
        // APIキーを保存
        chrome.storage.sync.set({
            geminiApiKey: apiKey
        }, function() {
            if (chrome.runtime.lastError) {
                showStatus('APIキーの保存に失敗しました: ' + chrome.runtime.lastError.message, 'error');
            } else {
                showStatus('APIキーが正常に保存されました！', 'success');
            }
        });
    });

    // 接続テストボタンの処理
    testButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('APIキーを入力してください。', 'error');
            return;
        }

        testButton.disabled = true;
        testButton.textContent = 'テスト中...';
        
        // 一時的にAPIキーを設定してテスト
        chrome.storage.sync.set({ geminiApiKey: apiKey }, function() {
            // テスト用のメッセージを送信
            chrome.runtime.sendMessage({
                action: 'checkTextWithGemini',
                text: 'テストメッセージです。'
            }, function(response) {
                testButton.disabled = false;
                testButton.textContent = '接続テスト';
                
                if (chrome.runtime.lastError) {
                    showStatus('テストに失敗しました: ' + chrome.runtime.lastError.message, 'error');
                } else if (response.error) {
                    showStatus('APIエラー: ' + response.error, 'error');
                } else {
                    showStatus('Gemini APIとの接続が正常に確認されました！', 'success');
                }
            });
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';
        
        // 3秒後にメッセージを非表示
        setTimeout(function() {
            statusDiv.style.display = 'none';
        }, 3000);
    }
});