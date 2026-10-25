/* =====================================================
   DB.JS — Connexion aux données Supabase
   ===================================================== */

const BudgetDB = {
  defaults: [
    { id: "cat-alimentation", name: "Alimentation", kind: "expense" },
    { id: "cat-logement", name: "Logement", kind: "expense" },
    { id: "cat-transport", name: "Transport", kind: "expense" },
    { id: "cat-loisirs", name: "Loisirs", kind: "expense" },
    { id: "cat-salaire", name: "Salaire", kind: "income" },
    { id: "cat-epargne", name: "Épargne", kind: "transfer" }
  ],

  async requireUser() {
    if (!window.supabaseClient) {
      throw new Error("La connexion Supabase n'est pas initialisée.");
    }

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) throw error;

    if (!data?.user) {
      throw new Error("Vous devez être connecté.");
    }

    return data.user;
  },

  async getTransactions() {
    await this.requireUser();

    const { data, error } = await supabaseClient
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Erreur de chargement :", error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      type: row.type || "expense",
      categoryId: row.category,
      amountCents: Math.round(Number(row.amount || 0) * 100),
      description: row.note || "",
      createdAt: row.created_at || ""
    }));
  },

  async putTransaction(transaction) {
    const user = await this.requireUser();

    if (!transaction?.date) {
      throw new Error("La date de l'opération est obligatoire.");
    }

    if (!["expense", "income", "transfer"].includes(transaction.type)) {
      throw new Error("Le type d'opération est invalide.");
    }

    const amountCents = Number(transaction.amountCents);

    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new Error("Le montant doit être positif et valide.");
    }

    const payload = {
      user_id: user.id,
      date: transaction.date,
      type: transaction.type,
      category: transaction.categoryId || null,
      amount: amountCents / 100,
      note: String(transaction.description || "").trim(),
      created_at: transaction.createdAt || new Date().toISOString()
    };

    if (transaction.id) {
      payload.id = transaction.id;
    }

    const { data, error } = await supabaseClient
      .from("transactions")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Erreur d'enregistrement :", error);
      throw error;
    }

    return data;
  },

  async deleteTransaction(id) {
    if (!id) {
      throw new Error("Identifiant de transaction manquant.");
    }

    await this.requireUser();

    const { error } = await supabaseClient
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur de suppression :", error);
      throw error;
    }
  },

  async getCategories() {
    return this.defaults.map(category => ({ ...category }));
  },

  async getBudgets() {
    // Les budgets ne sont pas encore stockés dans Supabase.
    return [];
  }
};