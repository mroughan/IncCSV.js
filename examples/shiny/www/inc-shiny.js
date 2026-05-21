(function () {
  function parseText(text) {
    if (!window.IncCSV) {
      throw new Error("IncCSV browser bundle is not loaded.");
    }
    return window.IncCSV.parseInc(text);
  }

  function sendParsed(file) {
    Shiny.setInputValue("inc_file", file, { priority: "event" });
  }

  function sendError(error) {
    Shiny.setInputValue("inc_error", error.message || String(error), {
      priority: "event",
    });
  }

  function parseTextarea() {
    try {
      const textarea = document.getElementById("inc_text");
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

  document.addEventListener("shiny:connected", function () {
    const parseButton = document.getElementById("parse_inc");
    const upload = document.getElementById("inc_upload");

    parseButton.addEventListener("click", parseTextarea);
    upload.addEventListener("change", function () {
      if (upload.files.length > 0) {
        parseUploadedFile(upload.files[0]);
      }
    });

    parseTextarea();
  });
})();
