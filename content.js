// Xの投稿入力欄を特定し、監視するスクリプト

console.log("X Enjo Checker content script loaded.");

function initEnjoChecker() {
    // 投稿入力欄のセレクタはXのUI変更によって変わる可能性があります
    // 現時点での一般的なセレクタの例
    const textareaSelector = 'div[data-contents="true"][role="textbox"], div[contenteditable="true"][role="textbox"]';

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const textarea = document.querySelector(textareaSelector);
                if (textarea && textarea.innerText !== lastCheckedText) {
                    lastCheckedText = textarea.innerText;
                    
                    // 既存のタイムアウトをクリア
                    if (checkTimeout) {
                        clearTimeout(checkTimeout);
                    }
                    
                    // 1秒後にチェックを実行
                    checkTimeout = setTimeout(() => {
                        checkTextForEnjo(textarea.innerText, textarea);
                    }, 1000);
                }
            }
        });
    });

    const config = { childList: true, subtree: true, characterData: true };
    // ページ全体を監視し、投稿入力欄が出現したら監視を開始
    const bodyObserver = new MutationObserver(() => {
        const textarea = document.querySelector(textareaSelector);
        if (textarea) {
            console.log("Found X textarea, starting to observe.");
            observer.observe(textarea, config);
            bodyObserver.disconnect(); // 監視を開始したらbodyの監視は不要
            lastCheckedText = textarea.innerText; // 初期テキストをチェック
            
            // 初期チェックも1秒後に実行
            if (textarea.innerText.trim()) {
                checkTimeout = setTimeout(() => {
                    checkTextForEnjo(textarea.innerText, textarea);
                }, 1000);
            }
        }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });
}

let lastCheckedText = "";
let currentHighlightSpan = null; // 既存のハイライトを管理するための変数
let checkTimeout = null; // タイムアウト管理用

// Gemini APIを使用した炎上可能性チェック
async function checkTextForEnjo(text, textareaElement) {
    console.log("Checking text:", text);
    let riskLevel = "safe";
    let warningMessage = "";

    // テキストが空の場合はチェックをスキップ
    if (!text || text.trim().length === 0) {
        displayRiskFeedback(riskLevel, warningMessage, textareaElement);
        return;
    }

    try {
        // Background scriptを通じてGemini APIを呼び出し
        const response = await new Promise((resolve, reject) => {
            // Chrome runtime が利用可能かチェック
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                reject(new Error('Extension context invalidated'));
                return;
            }

            chrome.runtime.sendMessage(
                { action: 'checkTextWithGemini', text: text },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                }
            );
        });

        if (response && response.error) {
            throw new Error(response.error);
        }

        riskLevel = (response && response.riskLevel) || "safe";
        warningMessage = (response && response.warningMessage) || "";

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        
        // Gemini APIが失敗した場合はセーフ判定とする
        console.log("Gemini API failed, marking as safe");
        riskLevel = "safe";
        warningMessage = "";
    }

    displayRiskFeedback(riskLevel, warningMessage, textareaElement);
}


function displayRiskFeedback(riskLevel, message, textareaElement) {
    // 既存のハイライトを削除
    if (currentHighlightSpan) {
        currentHighlightSpan.remove();
        currentHighlightSpan = null;
    }

    let borderColor = '';
    let backgroundColor = '';
    let textColor = '';
    let emoji = '';

    switch (riskLevel) {
        case "safe":
            borderColor = '#4CAF50'; // Green
            backgroundColor = 'rgba(76, 175, 80, 0.1)';
            textColor = '#333';
            emoji = '✅';
            break;
        case "caution":
            borderColor = '#FFC107'; // Amber
            backgroundColor = 'rgba(255, 193, 7, 0.1)';
            textColor = '#E65100';
            emoji = '⚠️';
            break;
        case "dangerous":
            borderColor = '#F44336'; // Red
            backgroundColor = 'rgba(244, 67, 54, 0.1)';
            textColor = '#D32F2F';
            emoji = '🚨';
            break;
    }

    // 投稿入力欄のスタイルを変更
    if (textareaElement) {
        textareaElement.style.border = `2px solid ${borderColor}`;
        textareaElement.style.backgroundColor = backgroundColor;
    }

    // 警告メッセージを表示
    const feedbackContainerId = 'enjo-checker-feedback';
    let feedbackContainer = document.getElementById(feedbackContainerId);
    if (!feedbackContainer) {
        feedbackContainer = document.createElement('div');
        feedbackContainer.id = feedbackContainerId;
        feedbackContainer.style.marginTop = '8px';
        feedbackContainer.style.padding = '8px';
        feedbackContainer.style.borderRadius = '5px';
        feedbackContainer.style.fontSize = '0.9em';
        feedbackContainer.style.fontWeight = 'bold';
        feedbackContainer.style.display = 'flex';
        feedbackContainer.style.alignItems = 'center';
        feedbackContainer.style.gap = '5px';
        // Xの投稿ボタンの近くに挿入
        const tweetButton = document.querySelector('div[data-testid="tweetButton"], div[data-testid="TweetCompose-Post"]'); // Xの投稿ボタンのセレクタも変更される可能性あり
        if (tweetButton && tweetButton.parentNode) {
            tweetButton.parentNode.insertBefore(feedbackContainer, tweetButton);
        } else {
            // 見つからない場合は、投稿入力欄の直後に挿入
            if (textareaElement && textareaElement.parentNode) {
                textareaElement.parentNode.insertBefore(feedbackContainer, textareaElement.nextSibling);
            }
        }
    }

    feedbackContainer.style.color = textColor;
    feedbackContainer.style.backgroundColor = backgroundColor;
    feedbackContainer.style.borderColor = borderColor;
    feedbackContainer.style.border = `1px solid ${borderColor}`;
    feedbackContainer.innerHTML = `${emoji} ${message}`;

    // Safeの場合はメッセージを非表示にする
    if (riskLevel === "safe") {
        if (feedbackContainer) feedbackContainer.style.display = 'none';
        if (currentHighlightSpan) {
            currentHighlightSpan.remove();
            currentHighlightSpan = null;
        }
        if (textareaElement) {
            textareaElement.style.border = ''; // 元に戻す
            textareaElement.style.backgroundColor = ''; // 元に戻す
        }
    } else {
        if (feedbackContainer) feedbackContainer.style.display = 'flex';
    }
}

// ページロード時にチェッカーを初期化
initEnjoChecker();