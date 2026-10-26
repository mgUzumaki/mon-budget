
// ==========================================
// APP.JS — Logique unifiée pour Mon Budget
// ==========================================

(() => {
  const $ = id => document.getElementById(id);
  let transactions = [], categories = [], budgets = [], toastTimer;
  let currentRange = 'month'; 
  let referenceDate = new Date(); 
  let dailyChartInstance = null;
  let doughnutInstance = null;

  let currentLang = localStorage.getItem('user_lang') || 'fr';
  let currentCurrency = localStorage.getItem('user_currency') || 'FCFA';
  let isSignupMode = false;

  const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistiques", nav_settings: "Réglages",
      btn_add: "Ajouter une opération", dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine", range_month: "Mois", range_year: "Année", range_day: "Jour",
      metric_net: "Solde net", metric_exp: "Total des dépenses", metric_exp_sub: "Consommation enregistrée",
      metric_inc: "Total des revenus", metric_inc_sub: "Entrées perçues", metric_save: "Épargne", metric_save_sub: "Virements d’épargne",
      chart_exp_title: "Évolution des dépenses", chart_exp_sub: "Activité et tendance",
      chart_cat_title: "Répartition par catégorie", chart_cat_sub: "Répartition des dépenses",
      recent_title: "Opérations récentes", recent_sub: "Vos dernières opérations", see_all: "Voir tout →",
      trans_intro: "Retrouvez, filtrez et corrigez vos opérations.", btn_new_op: "＋ Nouvelle opération",
      filter_all_types: "Tous les types", type_expense: "Dépenses", type_income: "Revenus", type_transfer: "Transferts", filter_all_cats: "Toutes les catégories",
      budget_intro: "Fixez une limite par catégorie et suivez votre consommation.", btn_new_budget: "＋ Créer un budget", budget_month_label: "Budgets pour le mois sélectionné",
      stats_intro: "Analysez vos revenus et vos dépenses.", stats_note: "Les transferts internes sont exclus des revenus et dépenses.",
      settings_intro: "Gérez vos préférences et vos données personnelles.", pref_currency: "Devise", pref_currency_desc: "Choisissez la monnaie d’affichage.",
      pref_lang: "Langue", pref_lang_desc: "Sélectionnez la langue de l’interface.",
      export_title: "Exporter une sauvegarde", export_desc: "Téléchargez vos données au format JSON.", btn_export: "Exporter mes données",
      import_title: "Restaurer une sauvegarde", import_desc: "Importez un fichier JSON.", btn_import: "Choisir un fichier JSON",
      cat_title: "Catégories", cat_desc: "Ajoutez et gérez vos catégories personnalisées.", btn_manage_cat: "Gérer les catégories",
      clear_title: "Effacer les données locales", clear_desc: "Cette action peut être irréversible.", btn_clear: "Effacer toutes les données",
      privacy_title: "Vos données restent privées", privacy_desc: "Stockées dans le cloud sécurisé."
    },
    en: {
      nav_dashboard: "Dashboard", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistics", nav_settings: "Settings",
      btn_add: "Add transaction", dash_intro: "Your financial situation at a glance.",
      range_week: "Week", range_month: "Month", range_year: "Year", range_day: "Day",
      metric_net: "Net Balance", metric_exp: "Total Expenses", metric_exp_sub: "Recorded consumption",
      metric_inc: "Total Income", metric_inc_sub: "Recorded inflows", metric_save: "Savings", metric_save_sub: "Savings transfers",
      chart_exp_title: "Expense Evolution", chart_exp_sub: "Activity and trend",
      chart_cat_title: "Category Breakdown", chart_cat_sub: "Expense breakdown",
      recent_title: "Recent Operations", recent_sub: "Latest operations", see_all: "View all →",
      trans_intro: "Find, filter and edit your operations.", btn_new_op: "＋ New transaction",
      filter_all_types: "All types", type_expense: "Expenses", type_income: "Income", type_transfer: "Transfers", filter_all_cats: "All categories",
      budget_intro: "Set a limit per category and track your spending.", btn_new_budget: "＋ Create budget", budget_month_label: "Budgets for selected month",
      stats_intro: "Analyze your income and expenses.", stats_note: "Internal transfers are excluded.",
      settings_intro: "Manage your preferences and personal data.", pref_currency: "Currency", pref_currency_desc: "Choose display currency.",
      pref_lang: "Language", pref_lang_desc: "Select interface language.",
      export_title: "Export Backup", export_desc: "Download your data as JSON.", btn_export: "Export my data",
      import_title: "Restore Backup", import_desc: "Import a JSON file.", btn_import: "Choose JSON file",
      cat_title: "Categories", cat_desc: "Add and manage custom categories.", btn_manage_cat: "Manage categories",
      clear_title: "Clear Local Data", clear_desc: "This action may be irreversible.", btn_clear: "Clear all data",
      privacy_title: "Your data remains private", privacy_desc: "Stored in a secure cloud."
    },
    zh: {
      nav_dashboard: "总览", nav_transactions: "交易记录", nav_budgets: "预算管理", nav_stats: "统计分析", nav_settings: "设置",
      btn_add: "添加交易", dash_intro: "一目了然您的财务状况。",
      range_week: "周", range_month: "月", range_year: "年", range_day: "日",
      metric_net: "净额", metric_exp: "总支出", metric_exp_sub: "已记录消费",
      metric_inc: "总收入", metric_inc_sub: "已记录收入", metric_save: "储蓄", metric_save_sub: "储蓄转账",
      chart_exp_title: "支出趋势", chart_exp_sub: "活动与趋势",
      chart_cat_title: "分类占比", chart_cat_sub: "支出分类",
      recent_title: "近期交易", recent_sub: "最近的操作", see_all: "查看全部 →",
      trans_intro: "查找、筛选和修改您的操作。", btn_new_op: "＋ 新建交易",
      filter_all_types: "所有类型", type_expense: "支出", type_income: "收入", type_transfer: "转账", filter_all_cats: "所有分类",
      budget_intro: "设定每个分类的预算限额并跟踪消费。", btn_new_budget: "＋ 创建预算", budget_month_label: "所选月份的预算",
      stats_intro: "分析您的收支数据。", stats_note: "内部转账不计入收支。",
      settings_intro: "控制您的个人数据与偏好。", pref_currency: "货币", pref_currency_desc: "选择显示货币。",
      pref_lang: "语言", pref_lang_desc: "选择界面语言。",
      export_title: "导出备份", export_desc: "将数据下载为 JSON 文件。", btn_export: "导出我的数据",
      import_title: "恢复备份", import_desc: "导入 JSON 文件。", btn_import: "选择 JSON 文件",
      cat_title: "分类", cat_desc: "添加和管理自定义分类。", btn_manage_cat: "管理分类",
      clear_title: "清除本地数据", clear_desc: "操作可能不可逆。", btn_clear: "清除所有数据",
      privacy_title: "您的数据完全隐私", privacy_desc: "安全存储于云端。"
    }
  };

  function t(key) { return translations[currentLang]?.[key] || translations['fr'][key] || key; }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (t(key)) el.textContent = t(key);
    });
    if ($("app-currency")) $("app-currency").value = currentCurrency;
    if ($("app-lang")) $("app-lang").value = currentLang;
    if ($("auth-lang-select")) $("auth-lang-select").value = currentLang;
  }

  const today = Finance.localDate();
  const categoryName = id => categories.find(c => c.id === id)?.name || "Catégorie";
  const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  
  function customMoney(cents) {
    const formatted = (cents / 100).toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ${currentCurrency}`;
  }

  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function showDialog(id) { $(id)?.showModal(); }
  function closeDialog(id) { $(id)?.close(); }
function showLogin() {
    const appDiv = $("app");
    if (appDiv) appDiv.hidden = true;
    showDialog("auth-dialog");
  }

  function showApp() {
    const appDiv = $("app");
    if (appDiv) appDiv.hidden = false;
    closeDialog("auth-dialog");
    refresh();
  }

  // --- MENU LATÉRAL MOBILE ---
  const sidebar = $("sidebar");
  const sidebarToggle = $("sidebar-toggle");
  const sidebarBackdrop = $("sidebar-backdrop");

  function toggleSidebar() {
    sidebar?.classList.toggle("is-open");
    sidebarBackdrop?.classList.toggle("is-visible");
    const isOpen = sidebar?.classList.contains("is-open");
    sidebarToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  sidebarToggle?.addEventListener("click", toggleSidebar);
  sidebarBackdrop?.addEventListener("click", toggleSidebar);

  // --- NAVIGATION ENTRE PAGES ---
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const page = btn.dataset.page;
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + page));
      document.querySelectorAll(".nav-link").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-current", b === btn ? "page" : false);
      });
      const titles = { dashboard: t('nav_dashboard'), transactions: t('nav_transactions'), budgets: t('nav_budgets'), statistics: t('nav_stats'), settings: t('nav_settings') };
      $("page-title").textContent = titles[page] || titles.dashboard;
      if (sidebar?.classList.contains("is-open")) toggleSidebar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // --- FILTRAGE PRÉCIS DES CATÉGORIES SELON LE TYPE ---
  function fillCategorySelect(selectId, filterFn, includeAllOption = false) {
    const sel = $(selectId);
    if (!sel) return;
    const old = sel.value;
    let html = includeAllOption ? `<option value="">${t('filter_all_cats')}</option>` : "";
    html += categories.filter(filterFn).map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
    sel.innerHTML = html;
    if ([...sel.options].some(o => o.value === old)) sel.value = old;
  }

  function renderCategoryOptions() {
    const type = $("transaction-type")?.value || "expense";

    // Formulaire d'ajout : affiche uniquement les catégories du type choisi (expense / income)
    fillCategorySelect(
      "transaction-category",
      category => category.kind === type
    );

    // Filtre de la page transactions : garde toutes les catégories
    fillCategorySelect(
      "filter-category",
      () => true,
      true
    );
  }

  $("transaction-type")?.addEventListener("change", renderCategoryOptions);


  // --- OUVERTURE DU CALENDRIER NATIF DE DATE ---
  const transactionDateInput = $("transaction-date");
  transactionDateInput?.addEventListener("click", () => {
    if (typeof transactionDateInput.showPicker === "function") {
      try { transactionDateInput.showPicker(); } catch (e) {}
    }
  });


  // --- NAVIGATION PÉRIODE TABLEAU DE BORD ---
  $("prev-period")?.addEventListener('click', () => {
    referenceDate.setMonth(referenceDate.getMonth() - 1);
    renderDashboard();
  });

  $("next-period")?.addEventListener('click', () => {
    referenceDate.setMonth(referenceDate.getMonth() + 1);
    renderDashboard();
  });

  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.range-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-pressed');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-pressed', 'true');
      currentRange = e.target.dataset.range;
      renderDashboard();
    });
  });


  // --- RENDU DES DONNÉES ---
  async function refresh() {
    try {
      [transactions, categories, budgets] = await Promise.all([
        BudgetDB.getTransactions(),
        BudgetDB.getCategories(),
        BudgetDB.getBudgets()
      ]);
      transactions.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
      renderAll();
    } catch (err) {
      console.error("Erreur de rafraîchissement :", err);
    }
  }

  function renderAll() {
    applyTranslations();
    renderCategoryOptions();
    renderDashboard();
    renderTransactions();
    updateUserProfileInfo();
  }

  function renderDashboard() {
    const income = Finance.sum(transactions, "income");
    const expense = Finance.sum(transactions, "expense");
    const net = income - expense;
    const saving = transactions.filter(t => t.type === "transfer" || /épargne|savings/i.test(categoryName(t.categoryId))).reduce((s, t) => s + t.amountCents, 0);

    const monthFormatted = new Intl.DateTimeFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' }).format(referenceDate);
    if ($("period-display-label")) $("period-display-label").textContent = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);

    if ($("metric-net")) {
      $("metric-net").textContent = customMoney(net);
      $("metric-net").style.color = net < 0 ? "#b74e48" : "#10b981";
    }
    if ($("metric-expense")) $("metric-expense").textContent = customMoney(expense);
    if ($("metric-income")) $("metric-income").textContent = customMoney(income);
    if ($("metric-saving")) $("metric-saving").textContent = customMoney(saving);

    renderCharts(transactions);
  }

  function renderCharts(items) {
    // Graphique dépenses journalières
    const canvasDaily = document.getElementById('dailyChart');
    if (canvasDaily && window.Chart) {
      if (dailyChartInstance) dailyChartInstance.destroy();
      const labels = ['Semaine', 'Mois en cours'];
      const dataVals = [Finance.sum(items, "expense") / 100, 0];
      dailyChartInstance = new Chart(canvasDaily.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Activité'],
          datasets: [{ label: 'Dépenses', data: [Finance.sum(items, "expense") / 100], backgroundColor: '#10b981', borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }
  }

  function renderTransactions() {
    const listEl = $("transaction-list");
    if (!listEl) return;
    listEl.innerHTML = transactions.length ? transactions.map(t => {
      const amountFormatted = t.type === "income" ? `+ ${customMoney(t.amountCents)}` : `− ${customMoney(t.amountCents)}`;
      const cls = t.type === "income" ? "positive" : "negative";
      return `<div class="transaction-row"><div><strong>${escapeHTML(t.description || categoryName(t.categoryId))}</strong><small>${escapeHTML(categoryName(t.categoryId))}</small></div><div class="amount ${cls}">${escapeHTML(amountFormatted)}</div></div>`;
    }).join("") : `<div class="empty-state">Aucune transaction enregistrée.</div>`;
  }

  async function updateUserProfileInfo() {
    const infoEl = $("user-session-info");
    if (!infoEl) return;
    try {
      const client = BudgetDB.client();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        const fullName = (meta.first_name || meta.last_name) ? `${meta.first_name || ''} ${meta.last_name || ''}`.trim() : 'Mon Compte';
        infoEl.innerHTML = `<strong>Utilisateur :</strong> ${escapeHTML(fullName)}<br><strong>Email :</strong> ${escapeHTML(user.email)}`;
      }
    } catch (e) {
      infoEl.textContent = "Session non connectée.";
    }
  }


  // --- GESTION AUTHENTIFICATION (GMAIL STYLE) ---
async function checkAuthAndStart() {
    try {
      const client = BudgetDB.client();
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        showLogin(); // Utilise notre nouvelle fonction
      } else {
        showApp();   // Utilise notre nouvelle fonction
      }
    } catch (e) {
      showLogin();
    }
  }

  $("tab-login")?.addEventListener("click", () => {
    $("tab-login").classList.add("active");
    $("tab-signup").classList.remove("active");
    $("signup-fields").hidden = true;
    $("btn-auth-submit").textContent = "Se connecter";
    $("auth-form").dataset.mode = "login";
  });

  $("tab-signup")?.addEventListener("click", () => {
    $("tab-signup").classList.add("active");
    $("tab-login").classList.remove("active");
    $("signup-fields").hidden = false;
    $("btn-auth-submit").textContent = "Créer mon compte";
    $("auth-form").dataset.mode = "signup";
  });

  $("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mode = $("auth-form").dataset.mode || "login";
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value.trim();
    const firstName = $("auth-firstname")?.value.trim() || "";
    const lastName = $("auth-lastname")?.value.trim() || "";
    const errEl = $("auth-error");
    if (errEl) errEl.textContent = "Connexion en cours...";

    try {
      const client = BudgetDB.client();
      if (mode === "signup") {
        const { error } = await client.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } });
        if (error) throw error;
        closeDialog("auth-dialog");
        toast("Compte créé avec succès ! Connectez-vous.");
} else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Connexion réussie !");
        showApp(); // Affiche l'application et ferme la modale d'un coup
      }
    } catch (err) {
      if (errEl) errEl.textContent = "Erreur : " + err.message;
    }
  });

  $("logout-btn")?.addEventListener("click", async () => {
    try {
      const client = BudgetDB.client();
      await client.auth.signOut();
      location.reload();
    } catch (e) {
      location.reload();
    }
  });

  // Changement de langue interface & auth
  $("auth-lang-select")?.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem('user_lang', currentLang);
    applyTranslations();
  });

  $("app-lang")?.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem('user_lang', currentLang);
    renderAll();
  });

  $("app-currency")?.addEventListener("change", (e) => {
    currentCurrency = e.target.value;
    localStorage.setItem('user_currency', currentCurrency);
    renderAll();
  });


  // --- GESTION FORMULAIRE TRANSACTION ---
  function openNewTransactionModal() {
    $("transaction-form").reset();
    $("transaction-date").value = today;
    renderCategoryOptions();
    showDialog("transaction-dialog");
  }

  $("quick-add")?.addEventListener("click", openNewTransactionModal);
  $("btn_new_op")?.addEventListener("click", openNewTransactionModal);
  $("mobile-add")?.addEventListener("click", openNewTransactionModal);

  $("transaction-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const tx = {
        date: $("transaction-date").value || today,
        amountCents: Finance.toCents($("transaction-amount").value),
        type: $("transaction-type").value,
        categoryId: $("transaction-category").value,
        description: $("transaction-description").value.trim()
      };
      await BudgetDB.putTransaction(tx);
      closeDialog("transaction-dialog");
      await refresh();
      toast("Opération enregistrée avec succès");
    } catch (err) {
      toast("Erreur : " + err.message);
    }
  });

  // --- EXPORT / IMPORT JSON ---
  $("export-data")?.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ transactions, categories, budgets }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `mon-budget-sauvegarde-${today}.json`);
    dlAnchorElem.click();
    toast("Sauvegarde exportée avec succès !");
  });

  $("import-file")?.addEventListener("change", (e) => {
    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const obj = JSON.parse(event.target.result);
        if (obj.transactions) {
          for (let tx of obj.transactions) { await BudgetDB.putTransaction(tx); }
          await refresh();
          toast("Données restaurées avec succès !");
        }
      } catch (err) { toast("Erreur de lecture du fichier JSON."); }
    };
    if (e.target.files[0]) fileReader.readAsText(e.target.files[0]);
  });

  // Lancement initial
  checkAuthAndStart();
})();
