(() => {
  const tesseractUrl =
    "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js";
  let loadingTesseract;

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);

    if (!loadingTesseract) {
      loadingTesseract = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = tesseractUrl;
        script.onload = () => resolve(window.Tesseract);
        script.onerror = () => {
          script.remove();
          reject(new Error("Impossible de charger Tesseract.js."));
        };
        document.head.append(script);
      }).catch(error => {
        loadingTesseract = null;
        throw error;
      });
    }

    return loadingTesseract;
  }

  async function readImage(file, format, onProgress = () => {}) {
    const tesseract = await loadTesseract();
    const languages = format === "fr" ? ["fra"] : ["eng", "chi_sim"];
    const worker = await tesseract.createWorker(languages, 1, {
      logger: ({ status, progress }) => {
        if (status === "recognizing text") {
          onProgress(Math.round(progress * 100));
        }
      }
    });

    try {
      const { data } = await worker.recognize(file);
      return data.text;
    } finally {
      await worker.terminate();
    }
  }

  function previousDay(date) {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 1);
    return day.toISOString().slice(0, 10);
  }

  function cleanLabel(text) {
    return text
      .trim()
      .replace(/^[@©®]+\s*/, "")
      .replace(/(\p{Script=Han})\s+(?=\p{Script=Han})/gu, "$1");
  }

  function parseText(text, { format, captureDate = "" }) {
    const rows = [];
    let groupDate = "";
    let current = null;

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;

      if (format === "fr") {
        const date = line.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (date) {
          groupDate = `${date[3]}-${date[2]}-${date[1]}`;
          current = null;
          continue;
        }
      }

      const amount = line.match(
        /([+−–-]?)\s*(\d+(?:[ \u00a0\u202f]\d{3})*[.,]\d{2})\s*(€|¥|￥)?$/
      );

      if (amount && (format !== "fr" || amount[3] === "€")) {
        const label = cleanLabel(line.slice(0, amount.index));
        const [whole, decimals] = amount[2].replace(/\s/g, "").split(/[.,]/);
        const amountCents = Number(whole) * 100 + Number(decimals);

        current = {
          date: format === "fr" ? groupDate : "",
          label,
          amountCents,
          type: amount[1] === "+" ? "income" : amount[1] ? "expense" : "",
          time: "",
          categoryHint: ""
        };
        rows.push(current);
        continue;
      }

      if (!current) continue;

      if (format === "fr") {
        const continuation = cleanLabel(line);
        if (continuation) {
          current.label = [current.label, continuation].filter(Boolean).join(" ");
        }
        continue;
      }

      const relativeDate = line.match(/^(Today|Yesterday)\s+(\d{1,2}:\d{2})$/i);
      if (relativeDate) {
        current.time = relativeDate[2];
        if (captureDate) {
          current.date = relativeDate[1].toLowerCase() === "today"
            ? captureDate
            : previousDay(captureDate);
        }
        continue;
      }

      const category = line.match(/^(Transport|Food)\b/i);
      if (category) current.categoryHint = category[1];
    }

    return rows;
  }

  window.CaptureImport = { readImage, parseText };
})();
