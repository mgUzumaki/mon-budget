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

  window.CaptureImport = { readImage };
})();
