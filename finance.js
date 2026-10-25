/* Calculs monétaires en centimes entiers. */
window.Finance = (() => {
  const money = cents => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format((cents||0)/100);
  const toCents = value => {
    const n=Number(String(value).replace(",","."));
    if(!Number.isFinite(n)||n<=0||n>999999999999) throw new Error("Saisissez un montant positif valide.");
    return Math.round((n+Number.EPSILON)*100);
  };
  const monthKey = date => date.slice(0,7);
  const yearKey = date => date.slice(0,4);
  const localDate = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const sum = (transactions,type) => transactions.filter(t=>t.type===type).reduce((a,t)=>a+t.amountCents,0);
  function inPeriod(t, period, key) {
    if(period==="year") return yearKey(t.date)===key;
    if(period==="day") return t.date===key;
    return monthKey(t.date)===key;
  }
  function summarize(transactions, period, key) {
    const items=transactions.filter(t=>inPeriod(t,period,key));
    const income=sum(items,"income"),expense=sum(items,"expense");
    return {income,expense,net:income-expense,items};
  }
  function dailyExpenses(transactions, month) {
    const [year,mo]=month.split("-").map(Number), days=new Date(year,mo,0).getDate();
    const totals=Array(days).fill(0);
    transactions.filter(t=>t.type==="expense"&&monthKey(t.date)===month).forEach(t=>totals[Number(t.date.slice(8,10))-1]+=t.amountCents);
    return totals;
  }
  function categoryTotals(transactions,categories,month) {
    const map={};
    transactions.filter(t=>t.type==="expense"&&monthKey(t.date)===month).forEach(t=>map[t.categoryId]=(map[t.categoryId]||0)+t.amountCents);
    return Object.entries(map).map(([id,cents])=>({id,name:categories.find(c=>c.id===id)?.name||"Catégorie supprimée",cents})).sort((a,b)=>b.cents-a.cents);
  }
  return {money,toCents,monthKey,yearKey,localDate,uid,sum,summarize,dailyExpenses,categoryTotals};
})();