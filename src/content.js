/**
 * ClearChat Content Script
 * Detects and removes sponsored ad blocks from ChatGPT's conversation interface.
 * Uses MutationObserver for real-time monitoring of dynamically injected content.
 */

(function () {
  "use strict";

  // Track session statistics for the badge and popup display.
  let sessionBlocked = 0;
  let isEnabled = true;

  // Load the enabled state from storage on initialization.
  chrome.storage.local.get(["enabled"], (result) => {
    isEnabled = result.enabled !== false;
    if (isEnabled) {
      scanAndRemove();
      startObserver();
    }
  });

  // Listen for toggle messages from the popup interface.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "toggle") {
      isEnabled = message.enabled;
      if (isEnabled) {
        scanAndRemove();
        startObserver();
      } else {
        stopObserver();
        restoreHiddenAds();
      }
      sendResponse({ success: true });
    }
    if (message.type === "getStats") {
      sendResponse({ sessionBlocked });
    }
    return true;
  });

  /**
   * Primary detection patterns for ChatGPT sponsored content.
   * These patterns target the structural and textual indicators of ad blocks.
   */
  const AD_PATTERNS = {
    // Text content patterns that indicate sponsored blocks.
    textIndicators: [
      "sponsored",
      "Sponsored",
      "SPONSORED",
      "Ad",
      "광고", // Korean localization support.
      "スポンサー", // Japanese localization support.
    ],

    // CSS selector patterns targeting known ad container structures.
    selectorPatterns: [
      '[data-testid*="sponsor"]',
      '[data-testid*="ad-"]',
      '[data-testid*="promoted"]',
      '[class*="sponsor"]',
      '[class*="promoted"]',
      '[class*="ad-block"]',
      '[class*="ad-container"]',
      '[class*="advertisement"]',
      '[aria-label*="Sponsored"]',
      '[aria-label*="sponsored"]',
      '[aria-label*="Advertisement"]',
    ],
  };

  /**
   * Determine if an element is a ChatGPT sponsored ad block.
   * Uses multiple heuristics to avoid false positives.
   */
  function isAdElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    // Check for direct "Sponsored" label text within the element.
    const sponsoredLabel = findSponsoredLabel(element);
    if (sponsoredLabel) return true;

    // Check for known ad-related data attributes and class names.
    for (const selector of AD_PATTERNS.selectorPatterns) {
      try {
        if (element.matches(selector) || element.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        // Skip invalid selectors gracefully.
      }
    }

    // Check for product card patterns typical of ChatGPT shopping ads.
    if (isProductCard(element)) return true;

    return false;
  }

  /**
   * Search for a "Sponsored" text label within the element tree.
   * The label must be a small, standalone text node to reduce false positives.
   */
  function findSponsoredLabel(element) {
    // Look for small text elements that contain exactly "Sponsored" as their content.
    const candidates = element.querySelectorAll("span, div, p, small, a");
    for (const el of candidates) {
      const text = el.textContent.trim();
      if (
        AD_PATTERNS.textIndicators.includes(text) &&
        el.children.length === 0 &&
        text.length < 20
      ) {
        return el;
      }
    }
    return null;
  }

  /**
   * Detect product card patterns that ChatGPT uses for shopping-style ads.
   * These typically include price, product image, and brand name in a card layout.
   */
  function isProductCard(element) {
    const text = element.textContent || "";
    const hasPrice = /\$\d+\.\d{2}/.test(text) || /In stock/.test(text);
    const hasSponsored = AD_PATTERNS.textIndicators.some((indicator) =>
      text.includes(indicator)
    );
    const hasProductImage =
      element.querySelectorAll("img").length > 0 &&
      element.querySelectorAll("a[href]").length > 0;

    // Require at least sponsored text plus one product indicator to reduce false positives.
    return hasSponsored && (hasPrice || hasProductImage);
  }

  /**
   * Find the best parent container to hide for a detected ad element.
   * Walk up the DOM tree to find the outermost ad container without
   * accidentally hiding legitimate conversation content.
   */
  function findAdContainer(element) {
    let current = element;
    let bestContainer = element;

    // Walk up the DOM tree looking for the outermost ad-specific container.
    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (!parent) break;

      // Stop at main conversation boundaries to avoid hiding real messages.
      if (
        parent.getAttribute("data-testid") === "conversation-turn" ||
        parent.role === "main" ||
        parent.tagName === "MAIN"
      ) {
        break;
      }

      // Check if the parent itself is still an ad container.
      if (isAdElement(parent)) {
        bestContainer = parent;
      }

      current = parent;
    }

    return bestContainer;
  }

  /**
   * Scan the entire page for ad elements and hide them.
   */
  function scanAndRemove() {
    if (!isEnabled) return;

    // Strategy 1: Use CSS selectors to find ad containers directly.
    for (const selector of AD_PATTERNS.selectorPatterns) {
      try {
        document.querySelectorAll(selector).forEach((el) => {
          hideAdElement(el);
        });
      } catch (e) {
        // Skip invalid selectors gracefully.
      }
    }

    // Strategy 2: Walk text nodes looking for "Sponsored" labels.
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent.trim();
          if (AD_PATTERNS.textIndicators.includes(text) && text.length < 20) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    const sponsoredNodes = [];
    while (walker.nextNode()) {
      sponsoredNodes.push(walker.currentNode);
    }

    sponsoredNodes.forEach((textNode) => {
      const parentElement = textNode.parentElement;
      if (parentElement) {
        // Walk up to find the full ad block container.
        const container = findAdContainer(parentElement);
        hideAdElement(container);
      }
    });

    // Strategy 3: Detect product card ad patterns anywhere on the page.
    document.querySelectorAll("[class]").forEach((el) => {
      if (isProductCard(el) && !el.dataset.clearchatProcessed) {
        const container = findAdContainer(el);
        hideAdElement(container);
      }
    });
  }

  /**
   * Hide a detected ad element and update the blocked counter.
   */
  function hideAdElement(element) {
    if (!element || element.dataset.clearchatHidden === "true") return;

    // Mark the element to prevent duplicate processing.
    element.dataset.clearchatHidden = "true";
    element.dataset.clearchatProcessed = "true";
    element.classList.add("clearchat-hidden");

    sessionBlocked++;
    updateBadge();
    persistStats();

    console.log(
      `[ClearChat] Blocked ad #${sessionBlocked}:`,
      element.className || element.tagName
    );
  }

  /**
   * Restore all hidden ad elements when the extension is disabled.
   */
  function restoreHiddenAds() {
    document.querySelectorAll('[data-clearchat-hidden="true"]').forEach((el) => {
      el.classList.remove("clearchat-hidden");
      el.dataset.clearchatHidden = "false";
    });
  }

  /**
   * Send the updated blocked count to the background service worker for badge display.
   */
  function updateBadge() {
    chrome.runtime.sendMessage({
      type: "updateBadge",
      count: sessionBlocked,
    });
  }

  /**
   * Persist blocked stats to storage for the popup dashboard.
   */
  function persistStats() {
    const today = new Date().toISOString().split("T")[0];
    chrome.storage.local.get(["stats"], (result) => {
      const stats = result.stats || { daily: {}, total: 0 };
      stats.total = (stats.total || 0) + 1;
      stats.daily[today] = (stats.daily[today] || 0) + 1;

      // Keep only the last 30 days of daily data to manage storage size.
      const keys = Object.keys(stats.daily).sort();
      if (keys.length > 30) {
        delete stats.daily[keys[0]];
      }

      chrome.storage.local.set({ stats });
    });
  }

  // MutationObserver instance reference for lifecycle management.
  let observer = null;

  /**
   * Start the MutationObserver to watch for dynamically injected ad content.
   */
  function startObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;

      let shouldScan = false;

      for (const mutation of mutations) {
        // Check newly added nodes for ad content.
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (isAdElement(node)) {
              const container = findAdContainer(node);
              hideAdElement(container);
            } else {
              // Check child elements of the added node as well.
              shouldScan = true;
            }
          }
        }
      }

      // Perform a full scan if complex DOM changes were detected.
      if (shouldScan) {
        requestAnimationFrame(() => scanAndRemove());
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("[ClearChat] Ad monitor started.");
  }

  /**
   * Stop the MutationObserver when the extension is disabled.
   */
  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
      console.log("[ClearChat] Ad monitor stopped.");
    }
  }

  // Run the initial scan after a short delay to let the page render fully.
  setTimeout(scanAndRemove, 1000);

  // Re-scan periodically to catch ads loaded after navigation events.
  setInterval(() => {
    if (isEnabled) scanAndRemove();
  }, 5000);

  console.log("[ClearChat] Extension loaded successfully.");
})();
