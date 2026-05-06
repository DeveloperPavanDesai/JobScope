chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "FETCH_JOB_DATA") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.length) {
        sendResponse({ error: "No active tab found" });
        return;
      }

      const tab = tabs[0];
      const tabId = tab.id;
      const tabUrl = tab.url || "";

      if (!tabId) {
        sendResponse({ error: "Active tab id is missing" });
        return;
      }

      if (
        tabUrl.startsWith("chrome://") ||
        tabUrl.startsWith("chrome-extension://") ||
        tabUrl.startsWith("edge://") ||
        tabUrl.startsWith("about:")
      ) {
        sendResponse({
          error: "This page is restricted. Open a regular website/job page and try again."
        });
        return;
      }

      const requestExtraction = () => {
        chrome.tabs.sendMessage(
          tabId,
          { action: "EXTRACT_JOB" },
          async (response) => {
            if (chrome.runtime.lastError) {
              console.error("Failed to extract job data:", chrome.runtime.lastError.message);
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }

            console.log("Extracted:", response);
            sendResponse({ success: true, data: response });
  
            // Send to backend
            // const res = await fetch("http://localhost:8000/api/jobs", {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json"
            //   },
            //   body: JSON.stringify(response)
            // });
  
            // const data = await res.json();
            // sendResponse(data);
          }
        );
      };

      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: ["content/content.js"]
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Failed to inject content script:", chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }

          requestExtraction();
        }
      );
    });
  
    return true;
  }
});