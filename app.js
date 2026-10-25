
/* =====================================================
   APP.JS — Mon Budget
   Compatible avec le index.html fourni
   ===================================================== */

(() => {
  "use strict";

  /* ---------- OUTILS ET ÉTAT ---------- */

  const $ = id => document.getElementById(id);

  let transactions = [];
  let categories = [];
  let budgets = [];
  let currentRange = "month";
  let referenceDate = new Date();
  let currentLang = localStorage.getItem("user_lang") || "fr";
  let currentCurrency = localStorage.getItem("user_currency") || "FCFA";
  let toastTimer;
  let dailyChart = null;
  let categoryChart = null;

  const client = () => {
    if (!window.supabaseClient) {
      throw new Error(
        "Supabase n'est pas initialisé. Vérifie la connexion dans index.html."
      );
    }
    return window.supabaseClient;
  };

  const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble",
      nav_transactions: "Transactions",
      nav_budgets: "Budgets",
      nav_stats: "Statistiques",
      nav_settings: "Réglages",
      btn_add: "Ajouter une opération",
      dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine",
      range_month: "Mois",
      range_year: "Année",
      range_day: "Jour",
      metric_net: "Solde net",
      metric_exp: "Total des dépenses",
      metric_inc: "Total des revenus",
      metric_save: "Épargne",
      chart_exp_title: "Évolution des dépenses",
      chart_exp_sub: "Activité et tendance",
      chart_cat_title: "Répartition par catégorie",
      chart_cat_sub: "Répartition des dépenses",
      recent_title: "Opérations récentes",
      recent_sub: "Vos dernières opérations",
      see_all: "Voir tout →",
      trans_intro: "Retrouvez, filtrez et corrigez vos opérations.",
      btn_new_op: "Nouvelle opération",
      filter_all_types: "Tous les types",
      type_expense: "Dépenses",
      type_income: "Revenus",
      type_transfer: "Transferts",
      filter_all_cats: "Toutes les catégories",
      budget_intro: "Fixez une limite par catégorie.",
      btn_new_budget: "Créer un budget",
      budget_month_label: "Budgets du mois sélectionné",
      stats_intro: "Analysez vos revenus et vos dépenses.",
      stats_note: "Les transferts internes sont exclus.",
      settings_intro: "Gérez vos préférences et vos données.",
      pref_currency: "Devise",
      pref_currency_desc: "Choisissez la monnaie d’affichage.",
      pref_lang: "Langue",
      pref_lang_desc: "Sélectionnez la langue de l’interface.",
      export_title: "Exporter une sauvegarde",
      export_desc: "Téléchargez vos données au format JSON.",
      btn_export: "Exporter mes données",
      import_title: "Restaurer une sauvegarde",
      import_desc: "Importez un fichier JSON.",
      btn_import: "Choisir un fichier JSON",
      cat_title: "Catégories",
      cat_desc: "Gérez vos catégories.",
      btn_manage_cat: "Gérer les catégories",
      clear_title: "Effacer les données locales",
      clear_desc: "Cette action peut être irréversible.",
      btn_clear: "Effacer toutes les données",
      privacy_title: "Vos données restent privées",
      privacy_desc: "Stockées dans votre espace sécurisé."
    },
    en: {
      nav_dashboard: "Dashboard",
      nav_transactions: "Transactions",
      nav_budgets: "Budgets",
      nav_stats: "Statistics",
      nav_settings: "Settings",
      btn_add: "Add transaction",
      dash_intro: "Your financial situation at a glance.",
      range_week: "Week",
      range_month: "Month",
      range_year: "Year",
      range_day: "Day",
      metric_net: "Net balance",
      metric_exp: "Total expenses",
      metric_inc: "Total income",
      metric_save: "Savings",
      chart_exp_title: "Expense trends",
      chart_exp_sub: "Activity and trends",
      chart_cat_title: "By category",
      chart_cat_sub: "Expense breakdown",
      recent_title: "Recent transactions",
      recent_sub: "Your latest transactions",
      see_all: "View all →",
      trans_intro: "Find and filter your transactions.",
      btn_new_op: "New transaction",
      filter_all_types: "All types",
      type_expense: "Expenses",
      type_income: "Income",
      type_transfer: "Transfers",
      filter_all_cats: "All categories",
      budget_intro: "Set a limit for each category.",
      btn_new_budget: "Create a budget",
      budget_month_label: "Budgets for selected month",
      stats_intro: "Analyze income and expenses.",
      stats_note: "Internal transfers are excluded.",
      settings_intro: "Manage your preferences and data.",
      pref_currency: "Currency",
      pref_currency_desc: "Choose your display currency.",
      pref_lang: "Language",
      pref_lang_desc: "Choose the interface language.",
      export_title: "Export backup",
      export_desc: "Download your data as JSON.",
      btn_export: "Export my data",
      import_title: "Restore backup",
      import_desc: "Import a JSON file.",
      btn_import: "Choose JSON file",
      cat_title: "Categories",
      cat_desc: "Manage your categories.",
      btn_manage_cat: "Manage categories",
      clear_title: "Clear local data",
      clear_desc: "This action may be irreversible.",
      btn_clear: "Clear all data",
      privacy_title: "Your data stays private",
      privacy_desc: "Stored in your secure space."
    }
  };

  function t(key) {
    return translations[currentLang]?.[key] ||
      translations.fr[key] ||
      key;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function toast(message) {
    const element = $("toast");
    if (!element) {
      console.log(message);
      return;
    }

    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      element.classList.remove("show");
    }, 3500);
  }

  function localDate(date = new Date()) {
    if (window.Finance?.localDate) {
      return Finance.localDate(date);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function toCents(value) {
    if (window.Finance?.toCents) {
      return Finance.toCents(value);
    }

    const number = Number(String(value).replace(",", "."));
    if (!Number.isFinite(number)) return 0;

    return Math.round(number * 100);
  }

  function formatMoney(cents) {
    const amount = Number(cents || 0) / 100;

    const symbols = {
      "FCFA": "FCFA",
      "€": "EUR",
      "$": "USD",
      "£": "GBP",
      "CHF": "CHF"
    };

    const code = symbols[currentCurrency] || currentCurrency;
    const locale = currentLang === "fr" ? "fr-FR" : "en-US";

    try {
      if (code === "FCFA") {
        return new Intl.NumberFormat(locale, {
          maximumFractionDigits: 0
        }).format(amount) + " FCFA";
      }

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currentCurrency}`;
    }
  }

  function getCategoryName(id) {
    return categories.find(category => category.id === id)?.name ||
      "Sans catégorie";
  }

  function getPeriodBounds() {
    const date = new Date(referenceDate);
    const start = new Date(date);
    const end = new Date(date);

    if (currentRange === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (currentRange === "week") {
      const weekday = (date.getDay() + 6) % 7;
      start.setDate(date.getDate() - weekday);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (currentRange === "year") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  function inSelectedPeriod(transaction) {
    if (!transaction.date) return false;

    const date = new Date(`${transaction.date}T12:00:00`);
    const { start, end } = getPeriodBounds();

    return date >= start && date <= end;
  }

  function getPeriodTransactions() {
    return transactions.filter(inSelectedPeriod);
  }

  function getSummary(items) {
    let income = 0;
    let expense = 0;
    let transfers = 0;

    items.forEach(transaction => {
      const amount = Number(transaction.amountCents || 0);

      if (transaction.type === "income") income += amount;
      else if (transaction.type === "expense") expense += amount;
      else if (transaction.type === "transfer") transfers += amount;
    });

    return {
      income,
      expense,
      transfers,
      net: income - expense
    };
  }

  /* ---------- TRADUCTIONS ---------- */

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });

    const currency = $("app-currency");
    if (currency) currency.value = currentCurrency;

    const language = $("app-lang");
    if (language) language.value = currentLang;

    const authLanguage = $("auth-lang-select");
    if (authLanguage) authLanguage.value = currentLang;
  }

  /* ---------- FENÊTRES ---------- */

  function showDialog(id) {
    const dialog = $(id);
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      closeDialog(button.dataset.close);
    });
  });

  /* ---------- MENU MOBILE ---------- */

  const sidebar = $("sidebar");
  const sidebarToggle = $("sidebar-toggle");
  const sidebarBackdrop = $("sidebar-backdrop");

  function setSidebarOpen(open) {
    if (!sidebar) return;

    sidebar.classList.toggle("is-open", open);
    sidebarBackdrop?.classList.toggle("is-visible", open);
    document.body.classList.toggle("sidebar-open", open);

    sidebarToggle?.setAttribute("aria-expanded", String(open));
  }

  sidebarToggle?.addEventListener("click", () => {
    setSidebarOpen(!sidebar?.classList.contains("is-open"));
  });

  sidebarBackdrop?.addEventListener("click", () => setSidebarOpen(false));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setSidebarOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) setSidebarOpen(false);
  });

  /* ---------- NAVIGATION ---------- */

  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (!page) return;

      document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === `page-${page}`);
      });

      document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link === button);
        if (link === button) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });

      const titles = {
        dashboard: t("nav_dashboard"),
        transactions: t("nav_transactions"),
        budgets: t("nav_budgets"),
        statistics: t("nav_stats"),
        settings: t("nav_settings")
      };

      if ($("page-title")) {
        $("page-title").textContent = titles[page] || titles.dashboard;
      }

      setSidebarOpen(false);

      if (page === "statistics") renderStatistics();
      if (page === "transactions") renderTransactions();
      if (page === "budgets") renderBudgets();
    });
  });

  document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.goto;
      document.querySelector(`.nav-link[data-page="${target}"]`)?.click();
    });
  });

  /* ---------- CATÉGORIES ---------- */

  function fillCategorySelect(id, filter = () => true, includeAll = false) {
    const select = $(id);
    if (!select) return;

    const previous = select.value;
    const options = categories.filter(filter);

    select.replaceChildren();

    if (includeAll) {
      const all = document.createElement("option");
      all.value = "";
      all.textContent = t("filter_all_cats");
      select.appendChild(all);
    }

    options.forEach(category => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      select.appendChild(option);
    });

    if ([...select.options].some(option => option.value === previous)) {
      select.value = previous;
    }
  }

  function renderCategoryOptions() {
    fillCategorySelect("transaction-category");
    fillCategorySelect(
      "filter-category",
      () => true,
      true
    );
  }

  /* ---------- TABLEAU DE BORD ---------- */

  function renderDashboard() {
    const periodTransactions = getPeriodTransactions();
    const summary = getSummary(periodTransactions);

    if ($("metric-net")) {
      $("metric-net").textContent = formatMoney(summary.net);
    }
    if ($("metric-expense")) {
      $("metric-expense").textContent = formatMoney(summary.expense);
    }
    if ($("metric-income")) {
      $("metric-income").textContent = formatMoney(summary.income);
    }
    if ($("metric-saving")) {
      $("metric-saving").textContent = formatMoney(summary.transfers);
    }

    const label = $("period-display-label");
    if (label) {
      const { start, end } = getPeriodBounds();

      if (currentRange === "year") {
        label.textContent = String(referenceDate.getFullYear());
      } else if (currentRange === "day") {
        label.textContent = localDate(referenceDate);
      } else if (currentRange === "week") {
        label.textContent = `${localDate(start)} – ${localDate(end)}`;
      } else {
        label.textContent = referenceDate.toLocaleDateString(
          currentLang === "fr" ? "fr-FR" : "en-US",
          { month: "long", year: "numeric" }
        );
      }
    }

    renderCharts(periodTransactions);
    renderRecentTransactions();
  }

  function renderCharts(items) {
    if (typeof Chart === "undefined") return;

    const dailyCanvas = $("dailyChart");
    if (dailyCanvas) {
      const byDay = new Map();

      items
        .filter(item => item.type === "expense")
        .forEach(item => {
          byDay.set(
            item.date,
            (byDay.get(item.date) || 0) + Number(item.amountCents || 0)
          );
        });

      const dailyData = [...byDay.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
      );

      dailyChart?.destroy();

      dailyChart = new Chart(dailyCanvas, {
        type: "line",
        data: {
          labels: dailyData.map(item => item[0]),
          datasets: [{
            label: t("chart_exp_title"),
            data: dailyData.map(item => item[1] / 100),
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    const categoryCanvas = $("categoryDoughnutChart");
    if (categoryCanvas) {
      const totals = new Map();

      items
        .filter(item => item.type === "expense")
        .forEach(item => {
          const name = getCategoryName(item.categoryId);
          totals.set(name, (totals.get(name) || 0) + Number(item.amountCents || 0));
        });

      categoryChart?.destroy();

      categoryChart = new Chart(categoryCanvas, {
        type: "doughnut",
        data: {
          labels: [...totals.keys()],
          datasets: [{
            data: [...totals.values()].map(value => value / 100)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }

  function renderRecentTransactions() {
    const container = $("recent-transactions");
    if (!container) return;

    const recent = [...transactions]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);

    if (!recent.length) {
      container.innerHTML = '<div class="empty-state">Aucune opération pour le moment.</div>';
      return;
    }

    container.innerHTML = recent.map(transaction => {
      const sign = transaction.type === "income" ? "+" :
        transaction.type === "expense" ? "−" : "";

      const cls = transaction.type === "income" ? "positive" :
        transaction.type === "expense" ? "negative" : "";

      return `
        <div class="transaction-row">
          <div class="transaction-main">
            <div class="transaction-icon">
              ${transaction.type === "income" ? "↗" :
                transaction.type === "expense" ? "↘" : "⇄"}
            </div>
            <div>
              <strong>${escapeHTML(transaction.description || "Opération")}</strong>
              <small>${escapeHTML(getCategoryName(transaction.categoryId))}</small>
            </div>
          </div>
          <div class="transaction-meta">${escapeHTML(transaction.date || "")}</div>
          <div class="amount ${cls}">${sign}${escapeHTML(formatMoney(transaction.amountCents))}</div>
        </div>
      `;
    }).join("");
  }

  /* ---------- CHANGEMENT DE PÉRIODE ---------- */

  document.querySelectorAll("#range-selector [data-range]").forEach(button => {
    button.addEventListener("click", () => {
      currentRange = button.dataset.range;

      document.querySelectorAll("#range-selector [data-range]").forEach(item => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });

      renderDashboard();
    });
  });

  function movePeriod(amount) {
    if (currentRange === "day") {
      referenceDate.setDate(referenceDate.getDate() + amount);
    } else if (currentRange === "week") {
      referenceDate.setDate(referenceDate.getDate() + amount * 7);
    } else if (currentRange === "year") {
      referenceDate.setFullYear(referenceDate.getFullYear() + amount);
    } else {
      referenceDate.setMonth(referenceDate.getMonth() + amount);
    }

    renderDashboard();
  }

  $("prev-period")?.addEventListener("click", () => movePeriod(-1));
  $("next-period")?.addEventListener("click", () => movePeriod(1));

  /* ---------- LISTE ET FILTRES ---------- */

  function getFilteredTransactions() {
    const query = ($("search-transactions")?.value || "").trim().toLowerCase();
    const type = $("filter-type")?.value || "";
    const category = $("filter-category")?.value || "";

    return transactions.filter(transaction => {
      const matchesQuery =
        !query ||
        String(transaction.description || "").toLowerCase().includes(query);

      const matchesType = !type || transaction.type === type;
      const matchesCategory = !category || transaction.categoryId === category;

      return matchesQuery && matchesType && matchesCategory;
    });
  }

  function renderTransactions() {
    const container = $("transaction-list");
    if (!container) return;

    const filtered = getFilteredTransactions();

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">Aucune transaction trouvée.</div>';
      return;
    }

    container.innerHTML = filtered.map(transaction => {
      const sign = transaction.type === "income" ? "+" :
        transaction.type === "expense" ? "−" : "";

      const cls = transaction.type === "income" ? "positive" :
        transaction.type === "expense" ? "negative" : "";

      const typeLabel = transaction.type === "income" ? "Revenu" :
        transaction.type === "expense" ? "Dépense" : "Transfert";

      return `
        <div class="transaction-row">
          <div class="transaction-main">
            <div class="transaction-icon">
              ${transaction.type === "income" ? "↗" :
                transaction.type === "expense" ? "↘" : "⇄"}
            </div>
            <div>
              <strong>${escapeHTML(transaction.description || "Opération")}</strong>
              <small>${escapeHTML(getCategoryName(transaction.categoryId))} · ${typeLabel}</small>
            </div>
          </div>
          <div class="transaction-meta">${escapeHTML(transaction.date || "")}</div>
          <div class="amount ${cls}">${sign}${escapeHTML(formatMoney(transaction.amountCents))}</div>
        </div>
      `;
    }).join("");
  }

  $("search-transactions")?.addEventListener("input", renderTransactions);
  $("filter-type")?.addEventListener("change", renderTransactions);
  $("filter-category")?.addEventListener("change", renderTransactions);

  /* ---------- STATISTIQUES ---------- */

  function renderStatistics() {
    const period = $("stats-period")?.value || "month";
    const monthValue = $("stats-month")?.value || localDate().slice(0, 7);

    const items = transactions.filter(transaction => {
      if (!transaction.date) return false;

      if (period === "year") {
        return transaction.date.slice(0, 4) === monthValue.slice(0, 4);
      }

      if (period === "day") {
        return transaction.date === localDate();
      }

      return transaction.date.slice(0, 7) === monthValue;
    });

    const summary = getSummary(items);

    if ($("stats-income")) $("stats-income").textContent = formatMoney(summary.income);
    if ($("stats-expense")) $("stats-expense").textContent = formatMoney(summary.expense);
    if ($("stats-net")) $("stats-net").textContent = formatMoney(summary.net);

    if ($("stats-heading")) {
      $("stats-heading").textContent = period === "year"
        ? `Synthèse ${monthValue.slice(0, 4)}`
        : period === "day"
          ? "Synthèse du jour"
          : `Synthèse ${monthValue}`;
    }
  }

  $("stats-period")?.addEventListener("change", renderStatistics);
  $("stats-month")?.addEventListener("change", renderStatistics);

  /* ---------- BUDGETS ---------- */

  function renderBudgets() {
    const container = $("budget-list");
    if (!container) return;

    if (!budgets.length) {
      container.innerHTML = '<div class="empty-state">Aucun budget configuré pour le moment.</div>';
      return;
    }

    container.innerHTML = '<div class="empty-state">La gestion des budgets nécessite une table dédiée dans Supabase.</div>';
  }

  $("add-budget")?.addEventListener("click", () => {
    toast("La création des budgets n'est pas encore configurée.");
  });

  $("manage-categories")?.addEventListener("click", () => {
    toast("La gestion des catégories personnalisées n'est pas encore configurée.");
  });

  $("clear-data")?.addEventListener("click", () => {
    toast("Pour éviter toute suppression accidentelle, les données Supabase ne sont pas effacées ici.");
  });

  /* ---------- OUVERTURE DU FORMULAIRE ---------- */

  function openTransactionDialog() {
    const form = $("transaction-form");
    if (form) form.reset();

    renderCategoryOptions();

    const dateInput = $("transaction-date");
    if (dateInput) dateInput.value = localDate();

    showDialog("transaction-dialog");
  }

  ["quick-add", "btn_new_op", "mobile-add"].forEach(id => {
    $(id)?.addEventListener("click", openTransactionDialog);
  });

  document.querySelectorAll("[data-open-transaction]").forEach(button => {
    button.addEventListener("click", openTransactionDialog);
  });

  /* ---------- ENREGISTREMENT D'UNE TRANSACTION ---------- */

  const transactionForm = $("transaction-form");

  transactionForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = transactionForm.querySelector('button[type="submit"]');
    if (submitButton?.disabled) return;

    try {
      const amountInput = $("transaction-amount");
      const dateInput = $("transaction-date");
      const typeInput = $("transaction-type");
      const categoryInput = $("transaction-category");
      const descriptionInput = $("transaction-description");

      if (!amountInput || !dateInput || !typeInput || !categoryInput) {
        throw new Error("Un champ obligatoire du formulaire est introuvable.");
      }

      if (!dateInput.value) {
        throw new Error("Choisis une date pour cette opération.");
      }

      const amountCents = toCents(amountInput.value);

      if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
        throw new Error("Saisis un montant supérieur à zéro.");
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enregistrement...";
      }

      await BudgetDB.putTransaction({
        date: dateInput.value,
        type: typeInput.value,
        categoryId: categoryInput.value || null,
        amountCents,
        description: descriptionInput?.value.trim() || ""
      });

      closeDialog("transaction-dialog");
      await refresh();
      toast("Opération enregistrée avec succès !");
    } catch (error) {
      console.error("Erreur d'enregistrement :", error);
      toast(`Échec de l'enregistrement : ${error.message || error}`);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enregistrer";
      }
    }
  });

  /* ---------- ACTUALISATION DES DONNÉES ---------- */

  async function refresh() {
    try {
      const [loadedTransactions, loadedCategories, loadedBudgets] =
        await Promise.all([
          BudgetDB.getTransactions(),
          BudgetDB.getCategories(),
          BudgetDB.getBudgets()
        ]);

      transactions = Array.isArray(loadedTransactions) ? loadedTransactions : [];
      categories = Array.isArray(loadedCategories) ? loadedCategories : [];
      budgets = Array.isArray(loadedBudgets) ? loadedBudgets : [];

      transactions.sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );

      applyTranslations();
      renderCategoryOptions();
      renderDashboard();
      renderTransactions();
      renderBudgets();
      renderStatistics();
      await updateUserProfileInfo();
    } catch (error) {
      console.error("Erreur de chargement :", error);
      toast(`Chargement impossible : ${error.message || error}`);
    }
  }

  // Rend l'actualisation accessible au reste de l'application.
  window.refresh = refresh;

  async function updateUserProfileInfo() {
    const element = $("user-session-info");
    if (!element) return;

    try {
      const { data, error } = await client().auth.getUser();
      if (error) throw error;

      const user = data?.user;
      if (!user) {
        element.textContent = "Aucun utilisateur connecté.";
        return;
      }

      const metadata = user.user_metadata || {};
      const name = [
        metadata.first_name,
        metadata.last_name
      ].filter(Boolean).join(" ") || "Mon compte";

      element.textContent = `${name} — ${user.email || ""}`;
    } catch (error) {
      console.error("Erreur du profil :", error);
    }
  }

  /* ---------- LANGUE ET DEVISE ---------- */

  $("app-lang")?.addEventListener("change", event => {
    const language = event.target.value;
    if (!translations[language]) return;

    currentLang = language;
    localStorage.setItem("user_lang", currentLang);

    applyTranslations();
    renderDashboard();
    renderTransactions();
    renderStatistics();
  });

  $("auth-lang-select")?.addEventListener("change", event => {
    const language = event.target.value;
    if (!translations[language]) return;

    currentLang = language;
    localStorage.setItem("user_lang", currentLang);
    applyTranslations();
  });

  $("app-currency")?.addEventListener("change", event => {
    currentCurrency = event.target.value;
    localStorage.setItem("user_currency", currentCurrency);

    renderDashboard();
    renderTransactions();
    renderStatistics();
    renderRecentTransactions();
  });

  /* ---------- EXPORT JSON ---------- */

  $("export-data")?.addEventListener("click", () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      budgets
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `mon-budget-${localDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    toast("Sauvegarde téléchargée.");
  });

  /* ---------- IMPORT JSON ---------- */

  $("import-file")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());

      if (!Array.isArray(backup.transactions)) {
        throw new Error("Le fichier ne contient aucune liste de transactions valide.");
      }

      for (const item of backup.transactions) {
        const amountCents = Number(item.amountCents);

        if (
          !item.date ||
          !["expense", "income", "transfer"].includes(item.type) ||
          !Number.isSafeInteger(amountCents) ||
          amountCents <= 0
        ) {
          throw new Error("Le fichier contient une transaction invalide.");
        }

        // Pas d'identifiant fourni : Supabase en créera un si le schéma le permet.
        await BudgetDB.putTransaction({
          date: item.date,
          type: item.type,
          categoryId: item.categoryId || null,
          amountCents,
          description: item.description || ""
        });
      }

      await refresh();
      toast("Importation terminée.");
    } catch (error) {
      console.error("Erreur d'import :", error);
      toast(`Importation impossible : ${error.message || error}`);
    } finally {
      event.target.value = "";
    }
  });

  /* ---------- AUTHENTIFICATION ---------- */

  function setAuthMode(mode) {
    const signup = mode === "signup";

    $("auth-form")?.setAttribute("data-mode", mode);
    $("tab-login")?.classList.toggle("active", !signup);
    $("tab-signup")?.classList.toggle("active", signup);

    const fields = $("signup-fields");
    if (fields) fields.hidden = !signup;

    const password = $("auth-password");
    if (password) {
      password.autocomplete = signup ? "new-password" : "current-password";
    }

    const submit = $("btn-auth-submit");
    if (submit) {
      submit.textContent = signup ? "Créer mon compte" : "Se connecter";
    }

    if ($("auth-error")) $("auth-error").textContent = "";
  }

  $("tab-login")?.addEventListener("click", () => setAuthMode("login"));
  $("tab-signup")?.addEventListener("click", () => setAuthMode("signup"));

  $("auth-form")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = $("auth-form");
    const errorElement = $("auth-error");
    const submitButton = $("btn-auth-submit");

    const mode = form?.dataset.mode || "login";
    const email = $("auth-email")?.value.trim() || "";
    const password = $("auth-password")?.value || "";
    const firstName = $("auth-firstname")?.value.trim() || "";
    const lastName = $("auth-lastname")?.value.trim() || "";

    if (errorElement) errorElement.textContent = "";
    if (submitButton) submitButton.disabled = true;

    try {
      const supabase = client();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        });

        if (error) throw error;

        if (data?.session) {
          closeDialog("auth-dialog");
          await refresh();
          toast("Compte créé avec succès.");
        } else if (errorElement) {
          errorElement.textContent =
            "Compte créé. Consulte ton e-mail pour confirmer l'inscription.";
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        closeDialog("auth-dialog");
        await refresh();
        toast("Connexion réussie.");
      }
    } catch (error) {
      console.error("Erreur d'authentification :", error);
      if (errorElement) {
        errorElement.textContent = error.message || "Connexion impossible.";
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  $("logout-btn")?.addEventListener("click", async () => {
    try {
      const { error } = await client().auth.signOut();
      if (error) throw error;
      location.reload();
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
      toast(`Déconnexion impossible : ${error.message || error}`);
    }
  });

  /* ---------- DÉMARRAGE ---------- */

  async function startApp() {
    applyTranslations();

    // Initialise les dates des sélecteurs de période.
    if ($("transaction-date")) {
      $("transaction-date").value = localDate();
    }

    if ($("budget-month")) {
      $("budget-month").value = localDate().slice(0, 7);
    }

    if ($("stats-month")) {
      $("stats-month").value = localDate().slice(0, 7);
    }

    try {
      const { data, error } = await client().auth.getSession();
      if (error) throw error;

      if (!data?.session) {
        showDialog("auth-dialog");
        return;
      }

      await refresh();
    } catch (error) {
      console.error("Erreur au démarrage :", error);
      toast(error.message || "Impossible de démarrer l'application.");
    }
  }

  startApp();
})();
