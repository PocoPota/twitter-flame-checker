// Popup script for extension

document.addEventListener('DOMContentLoaded', function() {
    const settingsBtn = document.getElementById('settingsBtn');
    const statusDiv = document.getElementById('status');

    // APIキーの状態をチェック
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
        if (result.geminiApiKey && result.geminiApiKey.trim()) {
            statusDiv.textContent = 'APIキー設定済み ✅';
            statusDiv.style.color = '#4CAF50';
        } else {
            statusDiv.textContent = 'APIキーの設定が必要です ⚠️';
            statusDiv.style.color = '#FF9800';
        }
    });

    // 設定ボタンをクリックしたときの処理
    settingsBtn.addEventListener('click', function() {
        // オプションページを開く
        chrome.runtime.openOptionsPage();
    });

    // ストレージの変更を監視してステータスを更新
    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.geminiApiKey) {
            if (changes.geminiApiKey.newValue && changes.geminiApiKey.newValue.trim()) {
                statusDiv.textContent = 'APIキー設定済み ✅';
                statusDiv.style.color = '#4CAF50';
            } else {
                statusDiv.textContent = 'APIキーの設定が必要です ⚠️';
                statusDiv.style.color = '#FF9800';
            }
        }
    });
});