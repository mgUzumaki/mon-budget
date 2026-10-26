// ==========================================
// APP.JS — Logique unifiée pour Mon Budget
// ==========================================

(() => {
  const $ = id => document.getElementById(id);
  let transactions = [], categories = [], budgets = [], toastTimer;
  let currentRange = 'month'; 
  let referenceDate = new Date(); 
  let dailyChartInstance = null;

  let currentLang = localStorage.getItem('user_lang') || 'fr';
  let currentCurrency = localStorage.getItem('user_currency') || 'FCFA';

  const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistiques", nav_settings: "Réglages",
      btn_add: "Ajouter une opération", dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine", range_month: "Mois", range_year: "Année", range_day: "Jour",
      metric_net: "Solde net", metric_exp: "Total des dépenses", metric_inc: "Total des revenus", metric_save: "Épargne",
      trans_intro: "Retrouvez, filtrez et corrigez vos opérations.", btn_new_op: "＋ Nouvelle opération",
      filter_all_types: "Tous les types", type_expense: "Dépenses", type_income: "Revenus", type_transfer: "Transferts", filter_all_cats: "Toutes les catégories"
    },
    en: {
      nav_dashboard: "Dashboard", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistics", nav_settings: "Settings",
      btn_add: "Add transaction", dash_intro: "Your financial situation at a glance.",
      range_week: "Week", range_month: "Month", range_year: "Year", range_day: "Day",
      metric_net: "Net Balance", metric_exp: "Total Expenses", metric_inc: "Total Income", metric_save: "Savings",
      trans_intro: "Find, filter and edit your operations.", btn_new_op: "＋ New transaction",
      filter_all_types: "All types", type_expense: "Expenses", type_income: "Income", type_transfer: "Transfers", filter_all_cats: "All categories"
    },
    zh: {
      nav_dashboard: "总览", nav_transactions: "交易记录", nav_budgets: "预算管理", nav_stats: "统计分析", nav_settings: "设置",
      btn_add: "添加交易", dash_intro: "一目了然您的财务状况。",
      range_week: "周", range_month: "月", range_year: "年", range_day: "日",
      metric_net: "净额", metric_exp: "总支出", metric_inc