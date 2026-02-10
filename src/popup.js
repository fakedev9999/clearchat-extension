/**
 * ClearChat Popup Script
 * Controls the toggle switch, loads stats from storage, and renders the weekly chart.
 */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");
  const statusText = document.getElementById("statusText");
  const todayCount = document.getElementById("todayCount");
  const todaySub = document.getElementById("todaySub");
  const sessionCount = document.getElementById("sessionCount");
  const totalCount = document.getElementById("totalCount");
  const chart = document.getElementById("chart");

  const today = new Date().toISOString().split("T")[0];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Initialize the toggle state from storage.
  chrome.storage.local.get(["enabled"], (result) => {
    const isEnabled = result.enabled !== false;
    updateToggleUI(isEnabled);
  });

  // Handle toggle click events.
  toggle.addEventListener("click", () => {
    const willEnable = !toggle.classList.contains("active");
    chrome.storage.local.set({ enabled: willEnable });
    updateToggleUI(willEnable);

    // Notify the content script about the state change.
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "toggle",
            enabled: willEnable,
          });
        }
      }
    );
  });

  /**
   * Update the toggle switch visual state and body class.
   */
  function updateToggleUI(isEnabled) {
    if (isEnabled) {
      toggle.classList.add("active");
      statusText.textContent = "Active";
      statusText.classList.remove("off");
      document.body.classList.remove("disabled");
    } else {
      toggle.classList.remove("active");
      statusText.textContent = "Paused";
      statusText.classList.add("off");
      document.body.classList.add("disabled");
    }
  }

  // Get session stats from the content script.
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "getStats" },
          (response) => {
            if (response) {
              sessionCount.textContent = formatNumber(response.sessionBlocked);
            }
          }
        );
      }
    }
  );

  // Load persistent stats from storage and render.
  chrome.storage.local.get(["stats"], (result) => {
    const stats = result.stats || { daily: {}, total: 0 };
    const todayBlocked = stats.daily[today] || 0;

    todayCount.textContent = formatNumber(todayBlocked);
    totalCount.textContent = formatNumber(stats.total);

    // Update the subtitle based on the count.
    if (todayBlocked === 0) {
      todaySub.textContent = "Your feed is clean";
    } else if (todayBlocked < 5) {
      todaySub.textContent = "A few ads caught";
    } else if (todayBlocked < 20) {
      todaySub.textContent = "Keeping it clean for you";
    } else {
      todaySub.textContent = "Heavy ad day blocked!";
    }

    renderChart(stats.daily);
  });

  /**
   * Render the 7-day bar chart showing daily blocked ad counts.
   */
  function renderChart(dailyData) {
    chart.innerHTML = "";
    const days = getLast7Days();
    const values = days.map((d) => dailyData[d.date] || 0);
    const maxVal = Math.max(...values, 1);

    days.forEach((day, i) => {
      const wrap = document.createElement("div");
      wrap.className = "chart-bar-wrap";

      const track = document.createElement("div");
      track.className = "chart-bar-track";

      const bar = document.createElement("div");
      bar.className = "chart-bar" + (day.date === today ? " today" : "");
      const heightPct = (values[i] / maxVal) * 100;
      bar.style.height = "0%";

      track.appendChild(bar);

      const label = document.createElement("div");
      label.className = "chart-day" + (day.date === today ? " today" : "");
      label.textContent = day.name;

      wrap.appendChild(track);
      wrap.appendChild(label);
      chart.appendChild(wrap);

      // Animate bars on render with a staggered delay.
      setTimeout(() => {
        bar.style.height = Math.max(heightPct, 4) + "%";
      }, 100 + i * 60);
    });
  }

  /**
   * Get the last 7 days with their date strings and short day names.
   */
  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split("T")[0],
        name: DAY_NAMES[d.getDay()],
      });
    }
    return days;
  }

  /**
   * Format a number for display with locale-appropriate separators.
   */
  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }
});
