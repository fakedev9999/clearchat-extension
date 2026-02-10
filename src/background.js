/**
 * ClearChat Background Service Worker
 * Manages the badge counter display and handles extension lifecycle events.
 */

// Set the initial badge state when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    stats: { daily: {}, total: 0 },
  });
  chrome.action.setBadgeBackgroundColor({ color: "#059669" });
  chrome.action.setBadgeText({ text: "" });
  console.log("[ClearChat] Extension installed successfully.");
});

// Listen for messages from the content script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateBadge") {
    const count = message.count;
    // Display the count on the extension badge icon.
    const badgeText = count > 0 ? String(count) : "";
    chrome.action.setBadgeText({
      text: badgeText,
      tabId: sender.tab?.id,
    });
    chrome.action.setBadgeBackgroundColor({
      color: "#059669",
      tabId: sender.tab?.id,
    });
  }
  return true;
});

// Reset the badge when navigating to a new page within ChatGPT.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    if (
      tab.url.includes("chat.openai.com") ||
      tab.url.includes("chatgpt.com")
    ) {
      chrome.action.setBadgeText({ text: "", tabId });
    }
  }
});
