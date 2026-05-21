(function () {
  let initialized = false;

  function setStatus(message, isError) {
    const status = document.getElementById("inc_client_status");
    if (!status) {
      return;
    }
    status.textContent = message;
    status.className = isError ? "text-danger" : "text-success";
  }

  function parseText(text) {
    if (!window.IncCSV) {
      throw new Error("IncCSV browser bundle is not loaded.");
    }
    return window.IncCSV.parseInc(text);
  }

  function sendParsed(file) {
    if (!window.Shiny || typeof Shiny.setInputValue !== "function") {
      throw new Error("Shiny is not connected yet.");
    }
    Shiny.setInputValue("inc_file", file, { priority: "event" });
    setStatus(
      `Parsed ${file.rows.length} row(s) and ${file.columns.length} column(s) in the browser.`,
      false
    );
  }

  function sendError(error) {
    const message = error.message || String(error);
    setStatus(message, true);
    if (window.Shiny && typeof Shiny.setInputValue === "function") {
      Shiny.setInputValue("inc_error", message, { priority: "event" });
    }
  }

  function parseTextarea() {
    try {
      const textarea = document.getElementById("inc_text");
      if (!textarea) {
        throw new Error("Could not find the INC text area.");
      }
      sendParsed(parseText(textarea.value));
    } catch (error) {
      sendError(error);
    }
  }

  function parseUploadedFile(file) {
    const reader = new FileReader();
    reader.addEventListener("load", function () {
      try {
        sendParsed(parseText(String(reader.result || "")));
      } catch (error) {
        sendError(error);
      }
    });
    reader.addEventListener("error", function () {
      sendError(reader.error || new Error("Could not read uploaded file."));
    });
    reader.readAsText(file);
  }

  function init() {
    if (initialized) {
      return;
    }

    if (!window.Shiny || typeof Shiny.setInputValue !== "function") {
      setStatus("Waiting for Shiny to connect...", false);
      window.setTimeout(init, 100);
      return;
    }

    const parseButton = document.getElementById("parse_inc");
    const upload = document.getElementById("inc_upload");

    if (!window.IncCSV) {
      sendError(new Error("IncCSV browser bundle did not load."));
      return;
    }

    if (!parseButton) {
      sendError(new Error("Could not find the parse button."));
      return;
    }

    initialized = true;
    parseButton.addEventListener("click", parseTextarea);

    if (upload) {
      upload.addEventListener("change", function () {
        if (upload.files.length > 0) {
          parseUploadedFile(upload.files[0]);
        }
      });
    }

    parseTextarea();
  }

  function start() {
    if (window.jQuery) {
      window.jQuery(document).on("shiny:connected", init);
    }
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
