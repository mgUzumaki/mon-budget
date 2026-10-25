// ==========================================
// APP.JS — Gestion de session pro (Style Gmail)
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

  // --- DÉCONNEXION AUTOMATIQUE PAR INACTIVITÉ (15 MIN) ---
  const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        await supabaseClient.auth.signOut();
        alert("Session expirée pour cause d'inactivité (15 minutes). Veuillez vous rebander.");
        location.reload();
      }
    }, INACTIVITY_LIMIT_MS);
  }

  // Écouteurs d'activité utilisateur (souris, clavier, tactile)
  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  // --- TRADUCTIONS ---
  const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistiques", nav_settings: "Sauvegarde & réglages",
      btn_add: "＋ Ajouter une opération", dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine", range_month: "Mois", range_year: "Année", range_day: "Jour",
      metric_net: "Solde Actuel / Net", metric_net_sub: "Capacité nette sur la période",
      metric_exp: "Total Dépenses", metric_exp_sub: "Consommation enregistrée",
      metric_inc: "Total Revenus", metric_inc_sub: "Entrées perçues",
      metric_save: "Épargne de côté", metric_save_sub: "Virements épargne",
      chart_exp_title: "Évolution des dépenses", chart_exp_sub: "Activité & courbe de tendance",
      chart_cat_title: "Répartition par catégorie", chart_cat_sub: "Vue en camembert",
      recent_title: "Opérations récentes", recent_sub: "Les dernières opérations enregistrées", see_all: "Voir tout →",
      trans_intro: "Retrouvez, filtrez et corrigez vos opérations.", btn_new_op: "＋ Nouvelle opération",
      filter_all_types: "Tous les types", type_expense: "Dépenses", type_income: "Revenus", type_transfer: "Transferts", filter_all_cats: "Toutes les catégories",
      budget_intro: "Fixez une limite par catégorie et suivez votre consommation.", btn_new_budget: "＋ Créer un budget", budget_month_label: "Budgets pour le mois sélectionné",
      stats_intro: "Analysez les revenus et dépenses à partir de vos données.", stats_note: "Les transferts internes sont exclus.", stats_activity: "Activité de la période", stats_activity_sub: "Comparaison revenus / dépenses",
      settings_intro: "Gardez le contrôle de vos données et préférences.", pref_currency: "Devise", pref_currency_desc: "Choisissez la monnaie d’affichage.", pref_lang: "Langue", pref_lang_desc: "Sélectionnez la langue de l’interface.",
      export_title: "Exporter une sauvegarde", export_desc: "Téléchargez toutes vos données en JSON.", btn_export: "Exporter mes données",
      import_title: "Restaurer une sauvegarde", import_desc: "Importez un fichier de sauvegarde JSON.", btn_import: "Choisir un fichier JSON",
      cat_title: "Catégories", cat_desc: "Ajoutez une catégorie personnalisée.", btn_manage_cat: "Gérer les catégories",
      clear_title: "Effacer les données locales", clear_desc: "Action irréversible sans sauvegarde.", btn_clear: "Effacer toutes les données",
      notice_title: "À savoir", notice_desc: "Données conservées de manière sécurisée dans le cloud.", footer_text: "Conçu pour une gestion simple et privée <span>•</span> Aucune connexion bancaire",
      modal_quick: "SAISIE RAPIDE", modal_type: "Type d’opération", modal_amount: "Montant", modal_date: "Date", modal_cat: "Catégorie", modal_desc: "Description", modal_optional: "(facultatif)", modal_nature: "Nature de la dépense", nature_var: "Variable", nature_fix: "Fixe", modal_recurring: "Opération récurrente",
      btn_cancel: "Annuler", btn_save: "Enregistrer", btn_close: "Fermer", btn_add: "Ajouter",
      privacy_title: "Vos données restent privées", privacy_desc: "Stockées dans le cloud sécurisé."
    },
    en: {
      nav_dashboard: "Dashboard", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistics", nav_settings: "Settings & Backup",
      btn_add: "＋ Add transaction", dash_intro: "Your financial situation at a glance.",
      range_week: "Week", range_month: "Month", range_year: "Year", range_day: "Day",
      metric_net: "Current Balance / Net", metric_net_sub: "Net capacity over period",
      metric_exp: "Total Expenses", metric_exp_sub: "Recorded consumption",
      metric_inc: "Total Income", metric_inc_sub: "Recorded inflows",
      metric_save: "Savings", metric_save_sub: "Savings transfers",
      chart_exp_title: "Expense Evolution", chart_exp_sub: "Activity & trend curve",
      chart_cat_title: "Category Breakdown", chart_cat_sub: "Doughnut view",
      recent_title: "Recent Operations", recent_sub: "Latest recorded transactions", see_all: "View all →",
      trans_intro: "Find, filter and edit your operations.", btn_new_op: "＋ New transaction",
      filter_all_types: "All types", type_expense: "Expenses", type_income: "Income", type_transfer: "Transfers", filter_all_cats: "All categories",
      budget_intro: "Set a limit per category and track your spending.", btn_new_budget: "＋ Create budget", budget_month_label: "Budgets for selected month",
      stats_intro: "Analyze your income and expenses.", stats_note: "Internal transfers are excluded.", stats_activity: "Period Activity", stats_activity_sub: "Income vs expenses comparison",
      settings_intro: "Keep control over your data and preferences.", pref_currency: "Currency", pref_currency_desc: "Choose display currency.", pref_lang: "Language", pref_lang_desc: "Select interface language.",
      export_title: "Export Backup", export_desc: "Download all your data as JSON.", btn_export: "Export my data",
      import_title: "Restore Backup", import_desc: "Import a JSON backup file.", btn_import: "Choose JSON file",
      cat_title: "Categories", cat_desc: "Add a custom category.", btn_manage_cat: "Manage categories",
      clear_title: "Clear Local Data", clear_desc: "Irreversible without backup.", btn_clear: "Clear all data",
      notice_title: "Good to know", notice_desc: "Data is stored securely in the cloud.", footer_text: "Designed for simple and private finance management <span>•</span> No bank connection",
      modal_quick: "QUICK ENTRY", modal_type: "Operation Type", modal_amount: "Amount", modal_date: "Date", modal_cat: "Category", modal_desc: "Description", modal_optional: "(optional)", modal_nature: "Expense Nature", nature_var: "Variable", nature_fix: "Fixed", modal_recurring: "Recurring operation",
      btn_cancel: "Cancel", btn_save: "Save", btn_close: "Close", btn_add: "Add",
      privacy_title: "Your data remains private", privacy_desc: "Stored securely in the cloud."
    },
    zh: {
      nav_dashboard: "总览", nav_transactions: "交易记录", nav_budgets: "预算管理", nav_stats: "统计分析", nav_settings: "备份与设置",
      btn_add: "＋ 添加交易", dash_intro: "一目了然您的财务状况。",
      range_week: "周", range_month: "月", range_year: "年", range_day: "日",
      metric_net: "当前净额 / 结余", metric_net_sub: "期间净额",
      metric_exp: "总支出", metric_exp_sub: "已记录消费",
      metric_inc: "总收入", metric_inc_sub: "已记录收入",
      metric_save: "储蓄", metric_save_sub: "转入储蓄",
      chart_exp_title: "支出趋势", chart_exp_sub: "活动与趋势曲线",
      chart_cat_title: "分类占比", chart_cat_sub: "环形图视图",
      recent_title: "近期交易", recent_sub: "最近记录的操作", see_all: "查看全部 →",
      trans_intro: "查找、筛选和修改您的操作。", btn_new_op: "＋ 新建交易",
      filter_all_types: "所有类型", type_expense: "支出", type_income: "收入", type_transfer: "转账", filter_all_cats: "所有分类",
      budget_intro: "设定每个分类的预算限额并跟踪消费。", btn_new_budget: "＋ 创建预算", budget_month_label: "所选月份的预算",
      stats_intro: "分析您的收支数据。", stats_note: "内部转账不计入收支。", stats_activity: "期间活动", stats_activity_sub: "收支对比",
      settings_intro: "控制您的个人数据与偏好。", pref_currency: "货币", pref_currency_desc: "选择显示货币。", pref_lang: "语言", pref_lang_desc: "选择界面语言。",
      export_title: "导出备份", export_desc: "将所有数据下载为 JSON 文件。", btn_export: "导出我的数据",
      import_title: "恢复备份", import_desc: "导入 JSON 备份文件。", btn_import: "选择 JSON 文件",
      cat_title: "分类", cat_desc: "添加自定义分类。", btn_manage_cat: "管理分类",
      clear_title: "清除本地数据", clear_desc: "无备份时操作不可逆。", btn_clear: "清除所有数据",
      notice_title: "须知", notice_desc: "数据安全保存在云端。", footer_text: "专为简单私密的财务管理而设计 <span>•</span> 无需连接银行",
      modal_quick: "快速记账", modal_type: "交易类型", modal_amount: "金额", modal_date: "日期", modal_cat: "分类", modal_desc: "描述", modal_optional: "(可选)", modal_nature: "支出性质", nature_var: "弹性", nature_fix: "固定", modal_recurring: "定期交易",
      btn_cancel: "取消", btn_save: "保存", btn_close: "关闭", btn_add: "添加",
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
  const categoryName = id => categories.find(c => c.id === id)?.name || "Catégorie supprimée";
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

  async function refresh() {
    [transactions, categories, budgets] = await Promise.all([
      BudgetDB.getTransactions(),
      BudgetDB.getCategories(),
      BudgetDB.getBudgets()
    ]);
    transactions.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
    renderAll();
  }

  function renderAll() {
    applyTranslations();
    renderCategoryOptions();
    renderDashboard();
    renderTransactions();
    renderBudgets();
    renderCategoryManager();
    updateUserProfileInfo();
  }

  // --- RENDU PROFIL & SESSION ---
  async function updateUserProfileInfo() {
    const infoEl = $("user-session-info");
    if (!infoEl) return;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      const meta = user.user_metadata || {};
      const fullName = (meta.first_name || meta.last_name) ? `${meta.first_name || ''} ${meta.last_name || ''}`.trim() : 'Mon Compte';
      const phone = meta.phone || 'Non renseigné';
      infoEl.innerHTML = `
        <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:15px;">
          <div style="font-size:16px; font-weight:700; color:#1e293b; margin-bottom:6px;">👤 ${escapeHTML(fullName)}</div>
          <div style="font-size:13px; color:#64748b; margin-bottom:4px;"><strong>Email :</strong> ${escapeHTML(user.email)}</div>
          <div style="font-size:13px; color:#64748b; margin-bottom:10px;"><strong>Téléphone :</strong> ${escapeHTML(phone)}</div>
          <div style="display:inline-flex; align-items:center; gap:6px; background:#d1fae5; color:#065f46; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;">
            <span style="width:8px; height:8px; background:#10b981; border-radius:50%;"></span> Session active (Sécurité 15min)
          </div>
        </div>
      `;
    }
  }

  // --- NAVIGATION ---
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + page));
      document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b === btn));
      const titles = { dashboard: t('nav_dashboard'), transactions: t('nav_transactions'), budgets: t('nav_budgets'), statistics: t('nav_stats'), settings: t('nav_settings') };
      $("page-title").textContent = titles[page] || titles.dashboard;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  function renderCategoryOptions() {
    const fill = (id, filter) => {
      const sel = $(id);
      if (!sel) return;
      const old = sel.value;
      sel.innerHTML = categories.filter(filter).map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
      if ([...sel.options].some(o => o.value === old)) sel.value = old;
    };
    fill("transaction-category", c => true);
    fill("budget-category", c => c.kind === "expense");
    const filterCat = $("filter-category");
    if (filterCat) {
      const old = filterCat.value;
      filterCat.innerHTML = `<option value="">${t('filter_all_cats')}</option>` + categories.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
      filterCat.value = old;
    }
  }

  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRange = e.target.dataset.range;
      referenceDate = new Date();
      renderDashboard();
    });
  });

  $("prev-period")?.addEventListener('click', () => {
    if (currentRange === 'month') referenceDate.setMonth(referenceDate.getMonth() - 1);
    else if (currentRange === 'year') referenceDate.setFullYear(referenceDate.getFullYear() - 1);
    else if (currentRange === 'week') referenceDate.setDate(referenceDate.getDate() - 7);
    renderDashboard();
  });

  $("next-period")?.addEventListener('click', () => {
    if (currentRange === 'month') referenceDate.setMonth(referenceDate.getMonth() + 1);
    else if (currentRange === 'year') referenceDate.setFullYear(referenceDate.getFullYear() + 1);
    else if (currentRange === 'week') referenceDate.setDate(referenceDate.getDate() + 7);
    renderDashboard();
  });

  function renderDashboard() {
    let filteredItems = [];
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonthKey = `${year}-${monthStr}`;

    if (currentRange === 'month') {
      filteredItems = transactions.filter(t => Finance.monthKey(t.date) === yearMonthKey);
      const monthFormatted = new Intl.DateTimeFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' }).format(referenceDate);
      if ($("period-display-label")) $("period-display-label").textContent = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);
      if ($("period-heading")) $("period-heading").textContent = `${t('range_month')} de ${monthFormatted}`;
    } else if (currentRange === 'year') {
      filteredItems = transactions.filter(t => t.date.startsWith(String(year)));
      if ($("period-display-label")) $("period-display-label").textContent = `${t('range_year')} ${year}`;
      if ($("period-heading")) $("period-heading").textContent = `Synthèse ${year}`;
    } else if (currentRange === 'week') {
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      filteredItems = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= startOfWeek && d <= endOfWeek;
      });

      const options = { day: 'numeric', month: 'short' };
      const startStr = startOfWeek.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', options);
      const endStr = endOfWeek.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', options);
      if ($("period-display-label")) $("period-display-label").textContent = `${startStr} - ${endStr}`;
      if ($("period-heading")) $("period-heading").textContent = `${startStr} au ${endStr}`;
    }

    const income = Finance.sum(filteredItems, "income");
    const expense = Finance.sum(filteredItems, "expense");
    const net = income - expense;
    const saving = filteredItems.filter(t => t.type === "transfer" && /épargne|savings/i.test(categoryName(t.categoryId))).reduce((s, t) => s + t.amountCents, 0);

    if ($("metric-net")) {
      $("metric-net").textContent = customMoney(net);
      $("metric-net").style.color = net < 0 ? "#b74e48" : "#10b981";
    }
    if ($("metric-expense")) $("metric-expense").textContent = customMoney(expense);
    if ($("metric-income")) $("metric-income").textContent = customMoney(income);
    if ($("metric-saving")) $("metric-saving").textContent = customMoney(saving);

    // Graphique journalier
    let chartLabels = [], chartValues = [];
    if (currentRange === 'week') {
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayName = new Intl.DateTimeFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }).format(d);
        chartLabels.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));
        const dayExp = filteredItems.filter(t => t.type === "expense" && t.date === dateStr).reduce((s, t) => s + t.amountCents, 0);
        chartValues.push(dayExp / 100);
      }
    } else if (currentRange === 'year') {
      const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      chartLabels = monthsShort;
      chartValues = monthsShort.map((_, index) => {
        const mStr = String(index + 1).padStart(2, '0');
        const mItems = transactions.filter(t => t.type === "expense" && t.date.startsWith(`${year}-${mStr}`));
        return mItems.reduce((s, t) => s + t.amountCents, 0) / 100;
      });
    } else {
      const daysCount = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysCount; d++) {
        const dStr = String(d).padStart(2, '0');
        const fullDate = `${yearMonthKey}-${dStr}`;
        chartLabels.push(d);
        const dayExp = filteredItems.filter(t => t.type === "expense" && t.date === fullDate).reduce((s, t) => s + t.amountCents, 0);
        chartValues.push(dayExp / 100);
      }
    }

    const canvasDaily = document.getElementById('dailyChart');
    if (canvasDaily) {
      const ctxDaily = canvasDaily.getContext('2d');
      if (dailyChartInstance) dailyChartInstance.destroy();
      dailyChartInstance = new Chart(ctxDaily, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [
            { type: 'bar', label: t('type_expense'), data: chartValues, backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.6 },
            { type: 'line', label: 'Tendance', data: chartValues, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.4, pointRadius: 3 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { callback: v => v + ' ' + currentCurrency } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Camembert
    const categoryMap = {};
    let totalExpenseCents = 0;
    filteredItems.filter(t => t.type === "expense").forEach(t => {
      const catName = categoryName(t.categoryId);
      categoryMap[catName] = (categoryMap[catName] || 0) + t.amountCents;
      totalExpenseCents += t.amountCents;
    });

    const canvasEl = document.getElementById('categoryDoughnutChart');
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      if (doughnutInstance) doughnutInstance.destroy();
      const catLabels = Object.keys(categoryMap);
      const catData = Object.values(categoryMap).map(cents => cents / 100);
      if (catLabels.length > 0) {
        doughnutInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: catData,
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
              borderWidth: 2, borderColor: '#ffffff'
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '65%' }
        });
      }
    }

    const recent = [...transactions].slice(0, 5);
    if ($("recent-transactions")) {
      $("recent-transactions").innerHTML = recent.length ? recent.map(t => transactionRow(t, false)).join("") : `<div class="empty-state">${t('recent_sub')}</div>`;
    }
  }

  function transactionRow(t, actions = true) {
    const icon = t.type === "income" ? "↗" : t.type === "transfer" ? "⇄" : "↘";
    const amount = t.type === "income" ? `+ ${customMoney(t.amountCents)}` : t.type === "expense" ? `− ${customMoney(t.amountCents)}` : customMoney(t.amountCents);
    const cls = t.type === "income" ? "positive" : t.type === "expense" ? "negative" : "";
    return `<div class="transaction-row"><div class="transaction-main"><span class="transaction-icon">${icon}</span><div><strong>${escapeHTML(t.description || categoryName(t.categoryId))}</strong><small>${escapeHTML(categoryName(t.categoryId))}</small></div></div><div class="transaction-meta">${new Date(t.date + "T12:00:00").toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div><div class="amount ${cls}">${escapeHTML(amount)}</div>${actions ? `<div class="row-actions"><button data-edit="${escapeHTML(t.id)}">Modifier</button><button data-delete="${escapeHTML(t.id)}">Supprimer</button></div>` : ""}</div>`;
  }

  function renderTransactions() {
    const q = $("search-transactions")?.value.trim().toLowerCase() || "";
    const type = $("filter-type")?.value || "";
    const list = transactions.filter(t => (!q || (t.description || "").toLowerCase().includes(q) || categoryName(t.categoryId).toLowerCase().includes(q)) && (!type || t.type === type));
    if ($("transaction-list")) {
      $("transaction-list").innerHTML = list.length ? list.map(t => transactionRow(t, true)).join("") : `<div class="empty-state">Aucune transaction trouvée.</div>`;
    }
  }

  function renderBudgets() {
    const month = $("budget-month")?.value || today.slice(0, 7);
    const active = budgets.filter(b => b.month === month);
    if ($("budget-list")) {
      $("budget-list").innerHTML = active.length ? active.map(b => {
        const spent = transactions.filter(t => t.type === "expense" && t.categoryId === b.categoryId && Finance.monthKey(t.date) === month).reduce((s, t) => s + t.amountCents, 0);
        const pct = spent / b.limitCents * 100;
        return `<article class="budget-card"><h3>${escapeHTML(categoryName(b.categoryId))}</h3><div class="budget-amount">${customMoney(spent)} <small>/ ${customMoney(b.limitCents)}</small></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(pct, 100)}%"></div></div></article>`;
      }).join("") : `<div class="panel empty-state">Aucun budget pour ce mois.</div>`;
    }
  }

  function renderCategoryManager() {
    const list = $("category-manage-list");
    if (list) {
      list.innerHTML = categories.map(c => `<div class="category-manage-row"><span>${escapeHTML(c.name)}</span></div>`).join("");
    }
  }

  // --- AUTHENTIFICATION GMAIL-STYLE ---
  async function checkAuthAndStart() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      showDialog("auth-dialog");
    } else {
      resetInactivityTimer();
      refresh();
    }
  }

  // Bascule Onglets Connexion / Inscription
  $("tab-login")?.addEventListener("click", () => {
    $("tab-login").classList.add("active");
    $("tab-signup").classList.remove("active");
    $("signup-fields").style.display = "none";
    $("btn-auth-submit").textContent = "Se connecter";
    $("auth-form").dataset.mode = "login";
  });

  $("tab-signup")?.addEventListener("click", () => {
    $("tab-signup").classList.add("active");
    $("tab-login").classList.remove("active");
    $("signup-fields").style.display = "block";
    $("btn-auth-submit").textContent = "Créer mon compte";
    $("auth-form").dataset.mode = "signup";
  });

  // Validation Formulaire
  $("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mode = $("auth-form").dataset.mode || "login";
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value.trim();
    const firstName = $("auth-firstname")?.value.trim() || "";
    const lastName = $("auth-lastname")?.value.trim() || "";
    const phone = $("auth-phone")?.value.trim() || "";
    const errEl = $("auth-error");
    if (errEl) errEl.textContent = "";

    if (mode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName, phone } }
      });
      if (error) {
        if (errEl) errEl.textContent = "Erreur : " + error.message;
      } else {
        closeDialog("auth-dialog");
        toast("Compte créé avec succès ! Se connecter...");
        refresh();
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        if (errEl) errEl.textContent = "Erreur : " + error.message;
      } else {
        closeDialog("auth-dialog");
        toast("Connexion réussie !");
        resetInactivityTimer();
        refresh();
      }
    }
  });

  $("logout-btn")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    toast("Déconnexion réussie");
    location.reload();
  });

  // Changement de langue direct
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

  // Ajout rapide
  $("quick-add")?.addEventListener("click", () => { $("transaction-form").reset(); showDialog("transaction-dialog"); });
  $("btn_new_op")?.addEventListener("click", () => { $("transaction-form").reset(); showDialog("transaction-dialog"); });
  $("mobile-add")?.addEventListener("click", () => { $("transaction-form").reset(); showDialog("transaction-dialog"); });

  $("transaction-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const tx = {
        id: Finance.uid(),
        date: $("transaction-date").value || today,
        amountCents: Finance.toCents($("transaction-amount").value),
        type: $("transaction-type").value,
        categoryId: $("transaction-category").value,
        description: $("transaction-description").value.trim(),
        createdAt: new Date().toISOString()
      };
      await BudgetDB.putTransaction(tx);
      closeDialog("transaction-dialog");
      await refresh();
      toast("Opération enregistrée");
    } catch (err) {
      toast("Erreur : " + err.message);
    }
  });

  // Initialisation au chargement
  checkAuthAndStart();
})();