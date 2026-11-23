(() => {
  const { t } = window.BudgetI18n;
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
          reject(new Error(t("could_not_load_the_image_reader")));
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
        const languages = ["fra", "eng", "chi_sim", "spa", "deu"];
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

const relativeDate = line.match(relativeDatePattern);
if (relativeDate) {
  current.time = relativeDate[2].replace(/\s/g, "").replace("：", ":");
  if (captureDate) {
    current.date = yesterdayPattern.test(relativeDate[1])
      ? previousDay(captureDate)
      : captureDate;
  }
  continue;
}

      const category = line.match(/^(Transport|Food)\b/i);
      if (category) current.categoryHint = category[1];
    }

    return rows;
  }

  window.CaptureImport = {
  readImage,
  parseText,
  isChinesePaymentCapture,
  hasRelativeDate: text =>
    text.split(/\r?\n/).some(line => relativeDatePattern.test(line.trim()))
};
})();
(() => {
  const { t } = window.BudgetI18n;
  const form = document.getElementById("capture-import-form");
  if (!form) return;

    const captureDateField = document.getElementById("capture-date-field");
  const captureDate = document.getElementById("capture-date");
    const currency = document.getElementById("capture-currency");
    const folder = document.getElementById("capture-folder");
    const manualCurrency = document.getElementById("transaction-currency");
  const currencyPlaceholder = new Option(t("choose_a_currency"), "");
  currencyPlaceholder.dataset.i18n = "choose_a_currency";
  currency.replaceChildren(currencyPlaceholder);

  for (const option of manualCurrency.options) {
    if (option.value) currency.add(option.cloneNode(true));
  }

  currency.value = "";

  const file = document.getElementById("capture-file");
  const readButton = document.getElementById("capture-read");
  const status = document.getElementById("capture-status");
  const preview = document.getElementById("capture-preview");

  function clearPreview() {
    preview.replaceChildren();
    status.textContent = "";
  }

  function addField(row, caption, control, name) {
    const label = document.createElement("label");
    label.textContent = `${caption} `;
    control.dataset.field = name;
    label.append(control);
    const paragraph = document.createElement("p");
    paragraph.append(label);
    row.append(paragraph);
  }

  function renderPreview(operations, currencyCode) {
    preview.replaceChildren();

    function addField(row, title, control, name) {
      const label = document.createElement("label");
      label.textContent = title;
      control.dataset.field = name;
      label.append(control);
      row.append(label);
    }

    operations.forEach((operation, index) => {
      const row = document.createElement("fieldset");
      row.className = "capture-operation";

      const heading = document.createElement("legend");
      heading.textContent = t("transaction_index", { index: index + 1 });
      row.append(heading);

      const description = document.createElement("textarea");
      description.rows = 2;
      description.value = operation.label;
      addField(row, t("description"), description, "description");

      const date = document.createElement("input");
      date.type = "date";
      date.value = operation.date;
      addField(row, t("date"), date, "date");

      const amount = document.createElement("input");
      amount.type = "number";
      amount.min = "0.01";
      amount.step = "0.01";
      amount.value = (operation.amountCents / 100).toFixed(2);
      addField(row, t("amount_currency", { currency: currencyCode }), amount, "amount");

      const type = document.createElement("select");
      type.add(new Option(t("choose_a_type"), ""));
      type.add(new Option(t("expense"), "expense"));
      type.add(new Option(t("income"), "income"));
      type.add(new Option(t("transfer"), "transfer"));
      type.value = operation.type;
      addField(row, t("transaction_type_2"), type, "type");

      const category = document.createElement("select");
      addField(row, t("category"), category, "category");

      function updateCategories() {
        const previous = category.value;
        category.replaceChildren(new Option(t("choose_a_category"), ""));
        category.disabled = !type.value;

        if (!type.value) return;

        for (const item of window.getTransactionCategoryOptions(type.value)) {
          category.add(new Option(item.name, item.id));
        }

        if (Array.from(category.options).some(option => option.value === previous)) {
          category.value = previous;
        }
      }

      type.addEventListener("change", updateCategories);
      updateCategories();
      row.dataset.transactionId = crypto.randomUUID();
      preview.append(row);
    });

    if (!operations.length) return;

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = t("save_transactions");

    const saveStatus = document.createElement("p");
    saveStatus.setAttribute("role", "status");
    preview.append(saveButton, saveStatus);

    saveButton.addEventListener("click", async () => {
            const folderId = folder.value;

      if (folder.disabled || !folderId) {
        saveStatus.textContent = "Choisis un dossier de destination.";
        if (!folder.disabled) folder.focus();
        return;
      }
      const rows = Array.from(preview.querySelectorAll(".capture-operation"));
      const entries = [];

      for (const row of rows) {
        const field = name => row.querySelector(`[data-field="${name}"]`);
        const date = field("date");
        const amount = field("amount");
        const type = field("type");
        const category = field("category");
        const invalidField = [
          [date, date.value && date.validity.valid],
          [amount, amount.value && amount.validity.valid],
          [type, type.value],
          [category, category.value]
        ].find(([, valid]) => !valid);

        if (invalidField) {
          saveStatus.textContent =
            t("check_the_date_amount_type_and_category_of_each_transaction");
          invalidField[0].focus();
          return;
        }

        entries.push({
          row,
          transaction: {
                        folderId,
            id: row.dataset.transactionId,
            date: date.value,
            amount: amount.value,
            currency: currencyCode,
            type: type.value,
            categoryId: category.value,
            description: field("description").value
          }
        });
      }

      const controls = Array.from(form.elements).filter(control => !control.disabled);
      controls.forEach(control => { control.disabled = true; });
      saveStatus.textContent = t("saving");
      let saved = 0;

      try {
        for (const { row, transaction } of entries) {
          await window.saveImportedTransaction(transaction);
          row.remove();
          saved += 1;
        }

        form.reset();
        clearPreview();
        status.textContent = t("transactions_saved_saved", { saved });
        status.scrollIntoView({ block: "nearest" });
      } catch (error) {
        saveStatus.textContent =
          t("saved_saved_the_remaining_transactions_are_still_shown_error", { saved, error: error.message });
      } finally {
        controls.forEach(control => { control.disabled = false; });
      }

      if (saved > 0) {
        try {
          await window.refreshAfterCaptureImport();
        } catch {
          saveStatus.textContent += " Recharge la page pour actualiser le tableau de bord.";
        }
      }
    });
  }
  const importDialog = document.getElementById("capture-import-dialog");

  importDialog.addEventListener("close", () => {
    form.reset();
    currency.value = "";
    captureDateField.hidden = true;
    clearPreview();
    importDialog.scrollTop = 0;
  });
  form.addEventListener("change", event => {
    if ([captureDate, currency, file].includes(event.target)) {
      clearPreview();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (readButton.disabled || !file.files[0]) return;

    const selectedDate = captureDate.value;
    const selectedCurrency = currency.value;
    const selectedFile = file.files[0];
    const controls = [captureDate, currency, file, readButton];

    preview.replaceChildren();
    controls.forEach(control => { control.disabled = true; });
    status.textContent = t("loading_the_image_reader");

    try {
      const text = await window.CaptureImport.readImage(
        selectedFile,
        "auto",
        percent => { status.textContent = t("scanning_image_percent", { percent }); }
      );
      if (!importDialog.open || file.files[0] !== selectedFile) return;
      const hasRelativeDates =
  isChinesePaymentCapture || window.CaptureImport.hasRelativeDate(text);
      const hasGroupedDates =
        /^\s*\d{2}\/\d{2}\/\d{4}\s*$/m.test(text);

      captureDateField.hidden = !hasRelativeDates;

      if (hasRelativeDates && !selectedDate) {
        status.textContent =
          t("enter_the_screenshot_date_then_select_scan_image_again");
        return;
      }

      if (!hasRelativeDates && !hasGroupedDates) {
        status.textContent = t("no_date_was_found_in_this_image");
        return;
      }

      const selectedFormat = hasRelativeDates ? "cn" : "fr";
      const operations = window.CaptureImport.parseText(text, {
        format: selectedFormat,
        captureDate: selectedDate
      });

      renderPreview(operations, selectedCurrency);
      status.textContent = operations.length
        ? t("transactions_found_count_review_the_fields", { count: operations.length })
        : t("no_transactions_found_check_that_the_image_is_readable");
    } catch (error) {
      status.textContent = t("could_not_scan_the_image_error", { error: error.message });
    } finally {
      controls.forEach(control => { control.disabled = false; });
    }
  });

  clearPreview();
  readButton.disabled = false;
})();
