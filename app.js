/* =====================================================
   APP.JS — Application Mon Budget
   ===================================================== */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  let transactions = [];
  let categories = [];
  let budgets = [];
  let toastTimer;

  let currentRange = "month";
  let referenceDate = new Date();

  let currentLang = localStorage.getItem("user_lang") || "fr";
  let currentCurrency = localStorage.getItem("user_currency") || "FCFA";

  const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble",
      nav_transactions: "Transactions",
      nav_budgets: "Budgets",
      nav_stats: "Statistiques",
      nav_settings: "Sauvegarde & réglages",
      btn_add: "＋ Ajouter une opération",
      dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine",
      range_month: "Mois",
      range_year: "Année",
      range_day: "Jour",
      metric_net: "Net de la période",
      metric_net_sub: "Revenus moins dépenses",
      metric_exp: "Total Dépenses",
      metric_exp_sub: "Dépenses de la période",
      metric_inc: "Total Revenus",
      metric_inc_sub: "Revenus de la période",
      metric_save: "Épargne de côté",
      metric_save_sub: "Virements épargne",
      chart_exp_title: "Évolution des dépenses",
      chart_exp_sub: "Activité et tendance",
      chart_cat_title: "Répartition par catégorie",
      chart_cat_sub: "Vue en camembert",
      recent_title: "Opérations récentes",
      recent_sub: "Dernières opérations enregistrées",
      see_all: "Voir tout →",
      trans_intro: "Retrouvez et filtrez vos opérations.",
      btn_new_op: "＋ Nouvelle opération",
      filter_all_types: "Tous les types",
      type_expense: "Dépenses",
      type_income: "Revenus",
      type_transfer: "Transferts",
      filter_all_cats: "Toutes les catégories",
      budget_intro: "Fixez une limite par catégorie.",
      btn_new_budget: "＋ Créer un budget",
      budget_month_label: "Budgets du mois sélectionné",
      stats_intro: "Analysez vos revenus et vos dépenses.",
      stats_note: "Les transferts internes sont exclus.",
      stats_activity: "Activité de la période",
      stats_activity_sub: "Revenus et dépenses",
      settings_intro: "Gérez vos données et préférences.",
      pref_currency: "Devise",
      pref_currency_desc: "Choisissez la monnaie d’affichage.",
      pref_lang: "Langue",
      pref_lang_desc: "Choisissez la langue de l’interface.",
      export_title: "Exporter une sauvegarde",
      export_desc: "Téléchargez vos données en JSON.",
      btn_export: "Exporter mes données",
      import_title: "Restaurer une sauvegarde",
      import_desc: "Importez un fichier JSON.",
      btn_import: "Choisir un fichier JSON",
      cat_title: "Catégories",
      cat_desc: "Gérez vos catégories.",
      btn_manage_cat: "Gérer les catégories",
      clear_title: "Effacer les données",
      clear_desc: "Attention : cette action peut être irréversible.",
      btn_clear: "Effacer toutes les données",
      notice_title: "À savoir",
      notice_desc: "Vos données sont gérées avec Supabase.",
      footer_text: "Gestion simple et privée <span>•</span> Aucune connexion bancaire",
      modal_quick: "SAISIE RAPIDE",
      modal_type: "Type d’opération",
      modal_amount: "Montant",
      modal_date: "Date",
      modal_cat: "Catégorie",
      modal_desc: "Description",
      modal_optional: "(facultatif)",
      modal_nature: "Nature de la dépense",
      nature_var: "Variable",
      nature_fix: "Fixe",
      modal_recurring: "Opération récurrente",
      btn_cancel: "Annuler",
      btn_save: "Enregistrer",
      btn_close: "Fermer",
      privacy_title: "Vos données restent privées",
      privacy_desc: "Stockées dans votre espace sécurisé."
    },

    en: {
      nav_dashboard: "Dashboard",
      nav_transactions: "Transactions",
      nav_budgets: "Budgets",
      nav_stats: "Statistics",
      nav_settings: "Settings & Backup",
      btn_add: "＋ Add transaction",
      dash_intro: "Your financial situation at a glance.",
      range_week: "Week",
      range_month: "Month",
      range_year: "Year",
      range_day: "Day",
      metric_net: "Period net",
      metric_net_sub: "Income minus expenses",
      metric_exp: "Total expenses",
      metric_exp_sub: "Expenses in this period",
      metric_inc: "Total income",
      metric_inc_sub: "Income in this period",
      metric_save: "Savings",
      metric_save_sub: "Savings transfers",
      chart_exp_title: "Expense evolution",
      chart_exp_sub: "Activity and trend",
      chart_cat_title: "Category breakdown",
      chart_cat_sub: "Doughnut chart",
      recent_title: "Recent transactions",
      recent_sub: "Latest recorded transactions",
      see_all: "View all →",
      trans_intro: "Find and filter your transactions.",
      btn_new_op: "＋ New transaction",
      filter_all_types: "All types",
      type_expense: "Expenses",
      type_income: "Income",
      type_transfer: "Transfers",
      filter_all_cats: "All categories",
      budget_intro: "Set a limit for each category.",
      btn_new_budget: "＋ Create budget",
      budget_month_label: "Budgets for selected month",
      stats_intro: "Analyze your income and expenses.",
      stats_note: "Internal transfers are excluded.",
      stats_activity: "Period activity",
      stats_activity_sub: "Income and expenses",
      settings_intro: "Manage your data and preferences.",
      pref_currency: "Currency",
      pref_currency_desc: "Choose your display currency.",
      pref_lang: "Language",
      pref_lang_desc: "Choose your interface language.",
      export_title: "Export backup",
      export_desc: "Download your data as JSON.",
      btn_export: "Export my data",
      import_title: "Restore backup",
      import_desc: "Import a JSON file.",
      btn_import: "Choose JSON file",
      cat_title: "Categories",
      cat_desc: "Manage your categories.",
      btn_manage_cat: "Manage categories",
      clear_title: "Clear data",
      clear_desc: "Warning: this action may be irreversible.",
      btn_clear: "Clear all data",
      notice_title: "Good to know",
      notice_desc: "Your data is managed with Supabase.",
      footer_text: "Simple, private finance management <span>•</span> No bank connection",
      modal_quick: "QUICK ENTRY",
      modal_type: "Transaction type",
      modal_amount: "Amount",
      modal_date: "Date",
      modal_cat: "Category",
      modal_desc: "Description",
      modal_optional: "(optional)",
      modal_nature: "Expense type",
      nature_var: "Variable",
      nature_fix: "Fixed",
      modal_recurring: "Recurring transaction",
      btn_cancel: "Cancel",
      btn_save: "Save",
      btn_close: "Close",
      privacy_title: "Your data stays private",
      privacy_desc: "Stored in your secure space."
    }
  };

  function t(key) {
    return translations[currentLang]?.[key] ||
      translations.fr[key] ||
      key;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const key = element.getAttribute("data-i18n");
      const value = t(key);

      if (!value) return;

      if (key === "footer_text") {
        element.innerHTML = value;
      } else {
        element.textContent = value;
      }
    });

    if ($("app-currency")) {
      $("app-currency").value = currentCurrency;
    }

    if ($("app-lang")) {
      $("app-lang").value = currentLang;
    }

    if ($("auth-lang-select")) {
      $("auth-lang-select").value = currentLang;
    }
  }

  function customMoney(cents) {
    const locale = currentLang === "fr" ? "fr-FR" : "en-US";

    return Finance.money(cents, currentCurrency, locale);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
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
    }, 3000);
  }

  function showDialog(id) {
    const dialog = $(id);

    if (dialog instanceof HTMLDialogElement && !dialog.open) {
      dialog.showModal();
    }
  }

  function closeDialog(id) {
    const dialog = $(id);

    if (dialog instanceof HTMLDialogElement && dialog.open) {
      dialog.close();
    }
  }

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
    sidebarToggle?.setAttribute(
      "aria-label",
      open ? "Fermer le menu" : "Ouvrir le menu"
    );
  }

  sidebarToggle?.addEventListener("click", () => {
    setSidebarOpen(!sidebar?.classList.contains("is-open"));
  });

  sidebarBackdrop?.addEventListener("click", () => {
    setSidebarOpen(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setSidebarOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      setSidebarOpen(false);
    }
  });

  /* ---------- CHARGEMENT DES DONNÉES ---------- */

  async function refresh() {
    try {
      const [loadedTransactions, loadedCategories, loadedBudgets] =
        await Promise.all([
          BudgetDB.getTransactions(),
          BudgetDB.getCategories(),
          BudgetDB.getBudgets()
        ]);

      transactions = loadedTransactions;
      categories = loadedCategories;
      budgets = loadedBudgets;

      transactions.sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || "")) ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

      renderAll();
    } catch (error) {
      console.error("Erreur de chargement :", error);

      toast(
        "Impossible de charger les données. Vérifiez votre connexion."
      );
    }
  }

  function renderAll() {
    applyTranslations();
    renderCategoryOptions();
    renderDashboard();
    renderTransactions();
    renderBudgets();
    updateUserProfileInfo();
  }

  async function updateUserProfileInfo() {
    const element = $("user-session-info");

    if (!element || !window.supabaseClient) return;

    try {
      const { data, error } = await supabaseClient.auth.getUser();

      if (error) throw error;

      const user = data?.user;

      if (!user) {
        element.textContent = "";
        return;
      }

      const metadata = user.user_metadata || {};

      const name = [
        metadata.first_name,
        metadata.last_name
      ].filter(Boolean).join(" ") || "Mon Compte";

      element.innerHTML = `
        <div class="user-info-card">
          <strong>👤 ${escapeHTML(name)}</strong>
          <div><strong>Email :</strong> ${escapeHTML(user.email || "")}</div>
        </div>
      `;
    } catch (error) {
      console.error("Erreur du profil :", error);
    }
  }

  /* ---------- NAVIGATION ENTRE LES PAGES ---------- */

  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;

      if (!page) return;

      document.querySelectorAll(".page").forEach(element => {
        element.classList.toggle(
          "active",
          element.id === `page-${page}`
        );
      });

      document.querySelectorAll(".nav-link").forEach(element => {
        element.classList.toggle("active", element === button);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ---------- CATÉGORIES ---------- */

  function renderCategoryOptions() {
    function fillSelect(id, filter) {
      const select = $(id);

      if (!select) return;

      const previousValue = select.value;

      select.innerHTML = categories
        .filter(filter)
        .map(category => `
          <option value="${escapeHTML(category.id)}">
            ${escapeHTML(category.name)}
          </option>
        `)
        .join("");

      if ([...select.options].some(option =>
        option.value === previousValue
      )) {
        select.value = previousValue;
      }
    }

    fillSelect("transaction-category", () => true);

    fillSelect(
      "budget-category",
      category => category.kind === "expense"
    );
  }

  /* ---------- TABLEAU DE BORD ---------- */

  function selectedPeriod() {
    const date = Finance.localDate(referenceDate);

    switch (currentRange) {
      case "day":
        return date;

      case "week":
        return date;

      case "year":
        return date.slice(0, 4);

      case "month":
      default:
        return date.slice(0, 7);
    }
  }

  function renderDashboard() {
    const key = selectedPeriod();

    const summary = Finance.summarize(
      transactions,
      currentRange,
      key
    );

    if ($("metric-net")) {
      $("metric-net").textContent = customMoney(summary.net);
    }

    if ($("metric-expense")) {
      $("metric-expense").textContent = customMoney(summary.expense);
    }

    if ($("metric-income")) {
      $("metric-income").textContent = customMoney(summary.income);
    }

    if ($("metric-saving")) {
      const savings = summary.transfers;

      $("metric-saving").textContent = customMoney(savings);
    }

    const periodLabel = $("period-display-label");

    if (periodLabel) {
      if (currentRange === "year") {
        periodLabel.textContent = key;
      } else if (currentRange === "day") {
        periodLabel.textContent = key;
      } else if (currentRange === "week") {
        const range = Finance.getWeekRange(key);
        periodLabel.textContent = `${range.start} — ${range.end}`;
      } else {
        periodLabel.textContent = key;
      }
    }
  }

  /* ---------- CHANGEMENT DE PÉRIODE ---------- */

  const rangeButtons = document.querySelectorAll("#range-selector button");

  rangeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const possibleRange =
        button.dataset.range ||
        button.dataset.period ||
        button.id.replace("range-", "");

      const allowedRanges = ["day", "week", "month", "year"];

      if (!allowedRanges.includes(possibleRange)) return;

      currentRange = possibleRange;

      rangeButtons.forEach(item => {
        item.classList.toggle("active", item === button);
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

  $("period-prev")?.addEventListener("click", () => movePeriod(-1));
  $("period-next")?.addEventListener("click", () => movePeriod(1));

  /* ---------- LISTE DES TRANSACTIONS ---------- */

  function renderTransactions() {
    const listElement = $("transaction-list");

    if (!listElement) return;

    if (transactions.length === 0) {
      listElement.innerHTML = `
        <div class="empty-state">
          Aucune transaction enregistrée.
        </div>
      `;

      return;
    }

    listElement.innerHTML = transactions.map(transaction => {
      const category = categories.find(
        item => item.id === transaction.categoryId
      );

      const typeLabel = {
        expense: "Dépense",
        income: "Revenu",
        transfer: "Transfert"
      }[transaction.type] || "Opération";

      const sign = transaction.type === "income" ? "+" :
        transaction.type === "expense" ? "−" : "";

      const amountClass = transaction.type === "income"
        ? "positive"
        : transaction.type === "expense"
          ? "negative"
          : "";

      return `
        <div class="transaction-row">
          <div class="transaction-main">
            <div class="transaction-icon">
              ${transaction.type === "income" ? "↗" :
                transaction.type === "expense" ? "↘" : "⇄"}
            </div>

            <div>
              <strong>
                ${escapeHTML(transaction.description || "Opération")}
              </strong>

              <small>
                ${escapeHTML(category?.name || "Sans catégorie")}
                · ${escapeHTML(typeLabel)}
              </small>
            </div>
          </div>

          <div class="transaction-meta">
            ${escapeHTML(transaction.date || "")}
          </div>

          <div class="amount ${amountClass}">
            ${sign}${escapeHTML(customMoney(transaction.amountCents))}
          </div>
        </div>
      `;
    }).join("");
  }

  /* ---------- BUDGETS ---------- */

  function renderBudgets() {
    const container = $("budget-list") || $("budget-grid");

    if (!container) return;

    if (!budgets.length) {
      container.innerHTML = `
        <div class="empty-state">
          Les budgets ne sont pas encore configurés.
        </div>
      `;

      return;
    }

    // L'affichage complet sera possible lorsque le stockage des
    // budgets sera défini dans BudgetDB et dans la base Supabase.
    container.innerHTML = `
      <div class="empty-state">
        Les données des budgets doivent encore être configurées.
      </div>
    `;
  }

  /* ---------- OUVERTURE DU FORMULAIRE ---------- */

  function openTransactionDialog() {
    const form = $("transaction-form");

    if (form) {
      form.reset();

      const dateInput = $("transaction-date");

      if (dateInput) {
        dateInput.value = Finance.localDate();
      }
    }

    showDialog("transaction-dialog");
  }

  [
    "add-transaction",
    "btn-add-transaction",
    "btn-new-transaction",
    "mobile-add"
  ].forEach(id => {
    $(id)?.addEventListener("click", openTransactionDialog);
  });

  document.querySelectorAll("[data-open-transaction]").forEach(button => {
    button.addEventListener("click", openTransactionDialog);
  });

  /* ---------- ENREGISTREMENT D'UNE TRANSACTION ---------- */

  $("transaction-form")?.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const amountInput = $("transaction-amount");
      const dateInput = $("transaction-date");
      const typeInput = $("transaction-type");
      const categoryInput = $("transaction-category");
      const descriptionInput = $("transaction-description");

      if (!amountInput || !dateInput || !typeInput) {
        throw new Error(
          "Certains champs du formulaire sont introuvables. Vérifiez les identifiants HTML."
        );
      }

      const transaction = {
        id: Finance.uid(),
        date: dateInput.value,
        type: typeInput.value,
        categoryId: categoryInput?.value || null,
        amountCents: Finance.toCents(amountInput.value),
        description: descriptionInput?.value.trim() || "",
        createdAt: new Date().toISOString()
      };

      await BudgetDB.putTransaction(transaction);
      await refresh();

      closeDialog("transaction-dialog");
      toast("Opération enregistrée avec succès !");
    } catch (error) {
      console.error("Erreur d'enregistrement :", error);
      toast(error.message || "Impossible d'enregistrer l'opération.");
    }
  });

  /* ---------- FERMETURE DES FENÊTRES ---------- */

  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.closeDialog;

      if (id) closeDialog(id);
    });
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
    link.download = `mon-budget-sauvegarde-${Finance.localDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast("Sauvegarde exportée avec succès !");
  });

  /* ---------- IMPORT JSON ---------- */

  $("import-file")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup || !Array.isArray(backup.transactions)) {
        throw new Error(
          "Le fichier ne contient pas de liste de transactions valide."
        );
      }

      for (const transaction of backup.transactions) {
        if (
          !transaction.date ||
          !["expense", "income", "transfer"].includes(transaction.type)
        ) {
          throw new Error("Une transaction du fichier est invalide.");
        }

        await BudgetDB.putTransaction({
          ...transaction,
          id: transaction.id || Finance.uid(),
          amountCents: Number(transaction.amountCents)
        });
      }

      await refresh();

      toast("Transactions restaurées avec succès !");
    } catch (error) {
      console.error("Erreur d'importation :", error);
      toast(error.message || "Impossible de lire le fichier JSON.");
    } finally {
      event.target.value = "";
    }
  });

  /* ---------- LANGUE ET DEVISE ---------- */

  $("app-lang")?.addEventListener("change", event => {
    const language = event.target.value;

    if (!translations[language]) return;

    currentLang = language;
    localStorage.setItem("user_lang", currentLang);

    renderAll();
  });

  $("auth-lang-select")?.addEventListener("change", event => {
    const language = event.target.value;

    if (!translations[language]) return;

    currentLang = language;
    localStorage.setItem("user_lang", currentLang);

    applyTranslations();
  });

  $("app-currency")?.addEventListener("change", event => {
    const currency = event.target.value;

    if (!/^[A-Z]{3}$/.test(currency)) {
      toast("Code de devise invalide.");
      return;
    }

    currentCurrency = currency;
    localStorage.setItem("user_currency", currentCurrency);

    renderAll();
  });

  /* ---------- AUTHENTIFICATION ---------- */

  $("tab-login")?.addEventListener("click", () => {
    $("tab-login")?.classList.add("active");
    $("tab-signup")?.classList.remove("active");

    if ($("signup-fields")) {
      $("signup-fields").style.display = "none";
    }

    if ($("btn-auth-submit")) {
      $("btn-auth-submit").textContent = "Se connecter";
    }

    if ($("auth-form")) {
      $("auth-form").dataset.mode = "login";
    }

    if ($("auth-error")) {
      $("auth-error").textContent = "";
    }
  });

  $("tab-signup")?.addEventListener("click", () => {
    $("tab-signup")?.classList.add("active");
    $("tab-login")?.classList.remove("active");

    if ($("signup-fields")) {
      $("signup-fields").style.display = "block";
    }

    if ($("btn-auth-submit")) {
      $("btn-auth-submit").textContent = "Créer mon compte";
    }

    if ($("auth-form")) {
      $("auth-form").dataset.mode = "signup";
    }

    if ($("auth-error")) {
      $("auth-error").textContent = "";
    }
  });

  $("auth-form")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = $("auth-form");
    const errorElement = $("auth-error");
    const submitButton = $("btn-auth-submit");

    const mode = form.dataset.mode || "login";
    const email = $("auth-email")?.value.trim() || "";
    const password = $("auth-password")?.value || "";
    const firstName = $("auth-firstname")?.value.trim() || "";
    const lastName = $("auth-lastname")?.value.trim() || "";

    if (!window.supabaseClient) {
      if (errorElement) {
        errorElement.textContent = "La connexion Supabase n'est pas initialisée.";
      }
      return;
    }

    if (errorElement) {
      errorElement.textContent = "Veuillez patienter...";
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      if (mode === "signup") {
        const { data, error } = await supabaseClient.auth.signUp({
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

        if (data.session) {
          closeDialog("auth-dialog");
          await refresh();
          toast("Compte créé avec succès !");
        } else {
          if (errorElement) {
            errorElement.textContent =
              "Compte créé. Consultez votre e-mail pour confirmer votre inscription.";
          }
        }
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        closeDialog("auth-dialog");
        await refresh();
        toast("Connexion réussie !");
      }
    } catch (error) {
      console.error("Erreur d'authentification :", error);

      if (errorElement) {
        errorElement.textContent =
          error.message === "Load failed"
            ? "Connexion impossible. Vérifiez votre réseau et la configuration Supabase."
            : error.message;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  $("logout-btn")?.addEventListener("click", async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      location.reload();
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
      toast("Impossible de vous déconnecter.");
    }
  });

  /* ---------- DÉMARRAGE ---------- */

  async function checkAuthAndStart() {
    try {
      if (!window.supabaseClient) {
        throw new Error(
          "Supabase n'est pas initialisé. Vérifiez l'ordre des scripts dans index.html."
        );
      }

      const { data, error } = await supabaseClient.auth.getSession();

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

  applyTranslations();
  checkAuthAndStart();
})();