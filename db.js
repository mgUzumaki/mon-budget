/* IndexedDB : stockage local uniquement, sans serveur ni envoi réseau. */
(function () {
  const DB_NAME = "mon-budget-db";
  const DB_VERSION = 1;
  const DEFAULT_CATEGORIES = [
    {id:"logement",name:"Logement",kind:"expense"},
    {id:"courses",name:"Courses",kind:"expense"},
    {id:"restaurants",name:"Restaurants",kind:"expense"},
    {id:"transport",name:"Transport",kind:"expense"},
    {id:"abonnements",name:"Abonnements",kind:"expense"},
    {id:"sante",name:"Santé",kind:"expense"},
    {id:"shopping",name:"Shopping",kind:"expense"},
    {id:"loisirs",name:"Loisirs",kind:"expense"},
    {id:"voyages",name:"Voyages",kind:"expense"},
    {id:"factures",name:"Factures",kind:"expense"},
    {id:"autres",name:"Autres",kind:"expense"},
    {id:"salaire",name:"Salaire",kind:"income"},
    {id:"autre-revenu",name:"Autre revenu",kind:"income"},
    {id:"epargne",name:"Épargne",kind:"transfer"},
    {id:"transfert-interne",name:"Transfert interne",kind:"transfer"}
  ];
  let dbPromise;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("transactions")) {
          const store = db.createObjectStore("transactions",{keyPath:"id"});
          store.createIndex("date","date",{unique:false});
        }
        if (!db.objectStoreNames.contains("categories")) db.createObjectStore("categories",{keyPath:"id"});
        if (!db.objectStoreNames.contains("budgets")) {
          const store = db.createObjectStore("budgets",{keyPath:"id"});
          store.createIndex("month","month",{unique:false});
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { dbPromise=null; reject(request.error); };
    });
    return dbPromise;
  }
  async function requestStore(storeName, mode, action) {
    const db = await openDB();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(storeName,mode);
      const store = tx.objectStore(storeName);
      let result;
      try { result = action(store); } catch(e) { reject(e); return; }
      tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
      tx.onerror = () => reject(tx.error || new Error("Erreur de stockage"));
      tx.onabort = () => reject(tx.error || new Error("Opération annulée"));
    });
  }
  async function all(store) {
    const db = await openDB();
    return new Promise((resolve,reject) => {
      const req=db.transaction(store,"readonly").objectStore(store).getAll();
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function seedCategories() {
    const existing = await all("categories");
    if (!existing.length) {
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction("categories","readwrite"), s=tx.objectStore("categories");
        DEFAULT_CATEGORIES.forEach(c=>s.put(c));
        tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
      });
    }
  }
  window.BudgetDB = {
    openDB, seedCategories, defaults: DEFAULT_CATEGORIES,
    getTransactions:()=>all("transactions"), getCategories:()=>all("categories"), getBudgets:()=>all("budgets"),
    putTransaction:x=>requestStore("transactions","readwrite",s=>s.put(x)),
    deleteTransaction:id=>requestStore("transactions","readwrite",s=>s.delete(id)),
    putCategory:x=>requestStore("categories","readwrite",s=>s.put(x)),
    deleteCategory:id=>requestStore("categories","readwrite",s=>s.delete(id)),
    putBudget:x=>requestStore("budgets","readwrite",s=>s.put(x)),
    deleteBudget:id=>requestStore("budgets","readwrite",s=>s.delete(id)),
    async clearAll(){const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction(["transactions","categories","budgets"],"readwrite");["transactions","categories","budgets"].forEach(n=>tx.objectStore(n).clear());tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});await seedCategories();},
    async importData(data, mode) {
      const valid=validateBackup(data);
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const names=["transactions","categories","budgets"],tx=db.transaction(names,"readwrite");
        if(mode==="replace") names.forEach(n=>tx.objectStore(n).clear());
        valid.categories.forEach(x=>tx.objectStore("categories").put(x));
        valid.transactions.forEach(x=>tx.objectStore("transactions").put(x));
        valid.budgets.forEach(x=>tx.objectStore("budgets").put(x));
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
      if(mode==="replace"&&!valid.categories.length) await seedCategories();
      return {transactions:valid.transactions.length,categories:valid.categories.length,budgets:valid.budgets.length};
    }
  };
  function validateBackup(data) {
    if(!data || data.app!=="mon-budget" || data.version!==1 || !Array.isArray(data.transactions) || !Array.isArray(data.categories) || !Array.isArray(data.budgets)) throw new Error("Fichier non reconnu. Utilisez une sauvegarde Mon Budget valide.");
    const txs=data.transactions.map(t=>{
      if(!t || typeof t.id!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !Number.isSafeInteger(t.amountCents) || t.amountCents<=0 || !["income","expense","transfer"].includes(t.type) || typeof t.categoryId!=="string") throw new Error("Une transaction contient des données invalides.");
      return t;
    });
    const cats=data.categories.map(c=>{if(!c||typeof c.id!=="string"||typeof c.name!=="string"||!c.name.trim())throw new Error("Catégorie invalide.");return c;});
    const budgets=data.budgets.map(b=>{if(!b||typeof b.id!=="string"||typeof b.categoryId!=="string"||!/^\d{4}-\d{2}$/.test(b.month)||!Number.isSafeInteger(b.limitCents)||b.limitCents<=0)throw new Error("Budget invalide.");return b;});
    return {transactions:txs,categories:cats,budgets};
  }
})();