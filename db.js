/* =====================================================
   DB.JS — Connexion aux données Supabase
   ===================================================== */

const BudgetDB = {
  client() {
    const client = window.supabaseClient;

    if (!client) {
      throw new Error(
        "Supabase n'est pas initialisé. Vérifiez le bloc de connexion dans index.html."
      );
    }

    return client;
  },

  defaults: [
    { id: "cat-alimentation", name: "Alimentation", kind: "expense" },
    { id: "cat-logement", name: "Logement", kind: "expense" },
    { id: "cat-transport", name: "Transport", kind: "expense" },
    { id: "cat-loisirs", name: "Loisirs", kind: "expense" },
    { id: "cat-salaire", name: "Salaire", kind: "income" },
    { id: "cat-epargne", name: "Épargne", kind: "transfer" }
  ],

  async requireUser() {
    const client = this.client();

    const { data, error } = await client.auth.getUser();

    if (error) throw error;

    if (!data || !data.user) {
      throw new Error("Vous devez être connecté.");
    }

    return data.user;
  },

  async getTransactions() {
    const user = await this.requireUser();
    const client = this.client();

    const { data, error } = await client
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Erreur de chargement des transactions :", error);
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
    const client = this.client();

    if (!transaction || !transaction.date) {
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
      note: String(transaction.description || "").trim()
    };

    if (transaction.id) {
      payload.id = transaction.id;
    }

    const { data, error } = await client
      .from("transactions")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Erreur d'enregistrement :", error);
      throw error;
    }

    return {
      id: data.id,
      date: data.date,
      type: data.type || "expense",
      categoryId: data.category,
      amountCents: Math.round(Number(data.amount || 0) * 100),
      description: data.note || "",
      createdAt: data.created_at || ""
    };
  },

  async deleteTransaction(id) {
    if (!id) {
      throw new Error("Identifiant de transaction manquant.");
    }

    const user = await this.requireUser();
    const client = this.client();

    const { error } = await client
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur de suppression :", error);
      throw error;
    }
  },

// Remplace getCategories par ceci dans db.js :
  async getCategories() {
    const user = await this.requireUser();
    const client = this.client();

    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur de chargement des catégories :", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return this.defaults.map(category => ({ ...category }));
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      kind: row.kind || "expense",
      user_id: row.user_id
    }));
  },

  // Ajoute cette fonction juste après pour enregistrer une catégorie :
  async putCategory(category) {
    const user = await this.requireUser();
    const client = this.client();

    if (!category || !category.name) {
      throw new Error("Le nom de la catégorie est obligatoire.");
    }

    const payload = {
      user_id: user.id,
      name: category.name.trim(),
      kind: category.kind || "expense"
    };

    const { data, error } = await client
      .from("categories")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Erreur d'enregistrement de la catégorie :", error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      kind: data.kind || "expense",
      user_id: data.user_id
    };
  },

  // Ajoute aussi celle-ci pour pouvoir les supprimer :
  async deleteCategory(catId) {
    if (!catId) throw new Error("Identifiant de catégorie manquant.");
    const user = await this.requireUser();
    const client = this.client();

    const { error } = await client
      .from("categories")
      .delete()
      .eq("id", catId)
      .eq("user_id", user.id);

    if (error) throw error;
  },
  async getBudgets() {
    return [];
  },
   // --- FINANCEMENTS / PROJETS ---
  async getFinancings() {
    const user = await this.requireUser();
    const client = this.client();

    const { data, error } = await client
      .from("financings")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur chargement financements :", error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      targetAmount: Number(row.target_amount || 0),
      currentAmount: Number(row.current_amount || 0),
      months: Number(row.months || 1),
      monthlyEffort: Number(row.monthly_effort || 0),
      status: row.status || "simulation"
    }));
  },

  async putFinancing(proj) {
    const user = await this.requireUser();
    const client = this.client();

    const payload = {
      user_id: user.id,
      name: proj.name,
      target_amount: proj.targetAmount,
      current_amount: proj.currentAmount,
      months: proj.months,
      monthly_effort: proj.monthlyEffort,
      status: proj.status || "simulation"
    };

    if (proj.id) payload.id = proj.id;

    const { data, error } = await client
      .from("financings")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
