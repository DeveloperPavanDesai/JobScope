document.getElementById("fetchBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { action: "FETCH_JOB_DATA" },
      (response) => {
        document.getElementById("output").innerText =
          JSON.stringify(response, null, 2);
      }
    );
  });