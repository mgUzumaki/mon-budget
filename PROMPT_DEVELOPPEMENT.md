# PROMPT MAÎTRE — ÉVOLUTION COMPLÈTE DE « MON BUDGET »
## De l'application de gestion budgétaire à un véritable assistant de financement personnel

Tu es mon développeur principal, architecte logiciel, expert JavaScript, Supabase et applications financières personnelles.

Tu dois reprendre mon application existante **Mon Budget**, analyser son architecture réelle, puis la faire évoluer progressivement vers une application complète de gestion de projets financiers, de simulation, de suivi d'épargne et d'analyse budgétaire.

Tu ne dois pas repartir de zéro.

Tu dois travailler directement sur les fichiers que je te fournis, préserver les fonctionnalités existantes et livrer du code réellement exploitable.

---

# 1. VISION DU PROJET

## Objectif général

Je veux faire évoluer Mon Budget pour qu'elle ne soit plus seulement une application permettant de suivre ses revenus et ses dépenses.

Je veux en faire un assistant financier personnel qui accompagne l'utilisateur dans la réalisation de ses projets.

Exemples :
- Acheter une voiture.
- Acheter un ordinateur.
- Préparer un voyage.
- Financer des travaux.
- Constituer une épargne de précaution.
- Préparer un achat immobilier.
- Financer une formation.
- Préparer un événement personnel.

L'utilisateur doit pouvoir :

1. Simuler un projet financier.
2. Connaître l'effort d'épargne nécessaire.
3. Vérifier si cet effort est compatible avec son budget réel.
4. Décider librement de suivre ou non ce projet.
5. Suivre sa progression chaque mois.
6. Comparer ses prévisions à ses résultats réels.
7. Adapter son effort d'épargne.
8. Obtenir un bilan final.
9. Archiver son projet et conserver son historique.

La fonctionnalité doit constituer un véritable parcours utilisateur, et non un simple calculateur.

---

# 2. ARCHITECTURE ACTUELLE À RESPECTER

Mon application existe déjà.

Voici les fichiers fournis :

- `index.html`
- `styles.css`
- `styles-fix.css`
- `app.js`
- `db.js`
- `finance.js`
- `manifest.json`

Tu dois examiner les versions réelles de ces fichiers avant toute modification.

## Architecture technique connue

L'application utilise actuellement :

- HTML pour la structure.
- CSS pour l'interface.
- JavaScript natif pour la logique.
- Supabase pour l'authentification et la persistance des données.
- Supabase JavaScript SDK v2 chargé depuis un CDN.
- Chart.js pour les graphiques.
- Un manifeste PWA.
- Une architecture organisée autour d'un objet global `BudgetDB`.
- Un objet global `Finance` pour les calculs financiers et les dates.

Il ne s'agit pas d'une application React, Vue ou Angular.

Ne transforme pas arbitrairement cette architecture en framework.

Ne crée pas de backend supplémentaire sans justification technique précise.

## 2.1. Structure de `index.html`

Le fichier contient notamment :

- Une page d'accueil et de connexion.
- Une interface privée après authentification.
- Une navigation latérale.
- Une page de tableau de bord.
- Une page Transactions.
- Une page Budgets.
- Une page Statistiques.
- Une page Simulateur de financement.
- Une page Réglages.
- Des formulaires et fenêtres modales.
- Le chargement de Supabase, Chart.js, `db.js`, `finance.js` et `app.js`.

La navigation utilise notamment les attributs `data-page`.

La page de financement existe déjà avec l'identifiant :

`page-financing`

Le formulaire du simulateur existe déjà avec l'identifiant :

`financing-sim-form`

Les principaux champs actuels sont :

- `sim-name`
- `sim-target`
- `sim-current`
- `sim-months`

Les résultats utilisent notamment :

- `sim-result-card`
- `res-proj-name`
- `res-rem-amount`
- `res-monthly-effort`
- `sim-feasibility-alert`

La liste des projets utilise :

`financing-projects-list`

Attention : un bouton de soumission est actuellement présent en dehors du formulaire du simulateur. Il faut vérifier et corriger cette anomalie sans casser les événements existants.

## 2.2. Structure de `app.js`

Le fichier contient déjà les principales fonctionnalités de l'application.

On y trouve notamment :

- Le chargement des transactions.
- Le chargement des catégories.
- Le chargement des budgets.
- Le rendu du tableau de bord.
- Le rendu des transactions.
- Le rendu des budgets.
- Le rendu des statistiques.
- Le système de traduction.
- Les filtres de période.
- La gestion des graphiques.
- La gestion de l'authentification.
- L'export et l'import de données.
- La gestion des financements.

La fonction `refresh()` récupère actuellement les données à travers :

- `BudgetDB.getTransactions()`
- `BudgetDB.getCategories()`
- `BudgetDB.getBudgets()`

La fonction `renderAll()` déclenche les différents rendus, notamment `renderFinancings()`.

La gestion du financement existe déjà dans la partie basse de `app.js`.

Les fonctions déjà présentes comprennent :

- La soumission du formulaire `financing-sim-form`.
- Le calcul de l'effort mensuel.
- Une première analyse de faisabilité.
- L'enregistrement d'une simulation.
- L'affichage des projets.
- La suppression d'un projet.

Ne supprime pas cette logique sans l'avoir étudiée.

Améliore-la progressivement.

## 2.3. Structure de `db.js`

Le fichier expose un objet global :

`BudgetDB`

Il utilise le client Supabase initialisé dans `index.html`.

La méthode `requireUser()` récupère l'utilisateur authentifié.

Les fonctions existantes comprennent :

- `getTransactions()`
- `putTransaction()`
- `deleteTransaction()`
- `getCategories()`
- `putCategory()`
- `deleteCategory()`
- `getBudgets()`
- `getFinancings()`
- `putFinancing()`
- `deleteFinancing()`

Les transactions sont stockées dans la table Supabase `transactions`.

Les catégories sont stockées dans `categories`.

Les projets de financement utilisent actuellement la table `financings`.

Les requêtes existantes filtrent les données par `user_id`.

Important : `getBudgets()` retourne actuellement un tableau vide. Tu dois vérifier si cette fonctionnalité est volontairement incomplète ou si la table et les données existent déjà ailleurs. Ne prétends pas que la persistance des budgets est opérationnelle sans l'avoir vérifiée.

La table `financings` est déjà utilisée par le code. Ses champs actuellement exploités sont :

- `id`
- `user_id`
- `name`
- `target_amount`
- `current_amount`
- `months`
- `monthly_effort`
- `status`

Ne suppose pas que le schéma Supabase réel est exactement identique à cette représentation sans le vérifier.

## 2.4. Structure de `finance.js`

Le fichier expose :

`window.Finance`

Il contient notamment :

- `money()`
- `toCents()`
- `localDate()`
- `monthKey()`
- `yearKey()`
- `uid()`
- `sum()`
- `getWeekRange()`
- `inPeriod()`
- `summarize()`
- `dailyExpenses()`
- `categoryTotals()`

Les montants des transactions sont manipulés en centimes dans la logique JavaScript.

La fonction `toCents()` rejette les montants nuls ou négatifs.

Il faut impérativement conserver cette convention monétaire : les calculs doivent utiliser des entiers en centimes autant que possible.

Ne mélange pas les euros et les centimes dans les calculs.

---

# 3. RÈGLES ABSOLUES DE DÉVELOPPEMENT

Ces règles sont obligatoires.

### Règle 1 — Préserver l'existant

Ne détruis aucune fonctionnalité actuellement opérationnelle.

Ne remplace pas toute l'application par une nouvelle structure.

Ne supprime pas :
- L'authentification.
- Les transactions.
- Les catégories.
- Les statistiques.
- Les graphiques.
- Les filtres.
- Les réglages.
- L'export des données.
- Les fonctionnalités PWA.

### Règle 2 — Respecter les données existantes

Les données actuelles des utilisateurs doivent être conservées.

Ne vide aucune table.

Ne supprime aucune donnée.

Ne réinitialise pas les comptes.

Ne lance pas de migration destructive.

### Règle 3 — Sécurité Supabase

Toutes les données financières doivent rester isolées par utilisateur.

Chaque opération de lecture, création, modification ou suppression doit vérifier l'identité de l'utilisateur et respecter son `user_id`.

Vérifie les politiques RLS existantes.

N'expose jamais de clé Supabase `service_role` dans le navigateur.

Ne considère pas une simple vérification JavaScript comme une protection suffisante.

### Règle 4 — Pas de fausses fonctionnalités

Ne crée pas de boutons décoratifs.

Ne crée pas de graphiques alimentés par des données fictives.

Ne simule pas une sauvegarde réussie si Supabase a renvoyé une erreur.

Toutes les fonctionnalités affichées doivent être réellement opérationnelles.

### Règle 5 — Qualité financière

Tous les montants doivent être exacts au centime.

Les dates doivent être cohérentes.

Les calculs doivent être reproductibles.

Les prévisions initiales doivent rester conservées même si le projet est modifié ensuite.

### Règle 6 — Livrer des fichiers complets

Lorsque tu modifies un fichier, fournis son contenu complet et exploitable.

Ne me donne pas seulement trois lignes à insérer à un endroit approximatif.

Indique précisément les fichiers modifiés et les éventuelles migrations SQL.

---

# 4. FONCTIONNALITÉS FINALES ATTENDUES

## MODULE A — SIMULATEUR DE FINANCEMENT

Le simulateur doit devenir une véritable entrée dans le parcours de financement.

### Informations demandées

L'utilisateur doit pouvoir renseigner :

- Nom du projet.
- Description facultative.
- Montant total nécessaire.
- Épargne déjà disponible.
- Durée souhaitée en mois.
- Date de début envisagée.
- Date cible éventuelle.
- Effort mensuel envisagé, si l'utilisateur préfère partir d'un montant mensuel.

Les champs doivent être simples et compréhensibles.

### Calculs

Calculer :

Montant restant à financer :

Montant total - épargne déjà disponible.

Effort mensuel nécessaire :

Montant restant / durée souhaitée.

Date estimée d'atteinte de l'objectif.

Pourcentage déjà financé.

Nombre de mois nécessaires selon un effort mensuel choisi.

Gérer correctement les cas particuliers :

- Épargne déjà supérieure à l'objectif.
- Objectif déjà atteint.
- Montant nul restant.
- Durée invalide.
- Montant négatif.
- Valeur décimale.
- Durée très longue.

Ne jamais appeler `Finance.toCents()` directement sur un montant qui peut être nul ou négatif.

### Analyse de faisabilité

L'application doit examiner le budget réel de l'utilisateur.

Elle doit distinguer :

- Les revenus.
- Les dépenses.
- Les transferts.
- L'épargne.
- Les engagements déjà prévus.
- La capacité d'épargne estimée.

La faisabilité ne doit pas être évaluée à partir du filtre actuellement sélectionné sur le tableau de bord.

Un filtre semaine, année ou période personnalisée ne doit pas modifier accidentellement le résultat de la simulation.

Il faut calculer une capacité mensuelle cohérente, avec une période de référence explicite.

Si les données disponibles sont insuffisantes, afficher une conclusion prudente plutôt que d'affirmer que le projet est faisable.

Présenter clairement :
- Faisable.
- Faisable sous conditions.
- Effort trop élevé.
- Données insuffisantes.

Expliquer pourquoi.

Ne jamais présenter une analyse indicative comme une garantie financière.

### Résultat visuel

Afficher une carte claire contenant :

- Montant total du projet.
- Épargne déjà disponible.
- Montant restant.
- Effort mensuel nécessaire.
- Durée.
- Date cible.
- Analyse de faisabilité.
- Explication de l'analyse.

Le résultat doit être compréhensible immédiatement.

---

## MODULE B — SAUVEGARDE ET ACTIVATION DU PROJET

Une simulation ne doit pas devenir automatiquement un projet actif.

Il faut distinguer trois actions :

1. Calculer une simulation.
2. Enregistrer une simulation.
3. Activer le suivi du projet.

L'utilisateur garde toujours le contrôle.

Après une simulation, proposer :

- Recommencer.
- Enregistrer la simulation.
- Activer le suivi du projet.

### Activation

Lorsque l'utilisateur choisit d'activer le suivi :

Afficher une étape de confirmation.

Expliquer que l'application va conserver un état initial de sa situation budgétaire pour mesurer les évolutions futures.

Demander son accord explicite.

L'utilisateur doit pouvoir choisir une durée de suivi.

Cette durée peut être différente de la durée de financement.

À l'activation, enregistrer :

- Les informations du projet.
- La date d'activation.
- La situation financière de référence.
- Les revenus de référence.
- Les dépenses de référence.
- La capacité d'épargne de référence.
- Les budgets de référence disponibles.
- L'objectif initial.
- L'épargne initiale.
- La durée prévue.
- L'effort mensuel prévu.

Cette photographie initiale ne doit jamais être écrasée par les actualisations mensuelles.

---

## MODULE C — PAGE « MES FINANCEMENTS »

Faire évoluer la page actuelle du simulateur pour proposer une véritable gestion des projets.

Je veux une page structurée avec :

### 1. Vue d'ensemble

Afficher :

- Nombre de projets actifs.
- Montant total des objectifs.
- Montant total déjà épargné.
- Progression globale.
- Effort mensuel total engagé.

Attention : ne pas additionner des projets qui utilisent les mêmes fonds disponibles sans avertissement.

### 2. Liste des projets

Chaque projet doit présenter :

- Nom.
- Montant cible.
- Montant déjà disponible.
- Montant restant.
- Barre de progression.
- Effort mensuel prévu.
- Date cible.
- Statut.
- Prochaine échéance éventuelle.

### 3. Statuts

Prévoir au minimum :

- Simulation.
- Actif.
- En pause.
- Terminé.
- Abandonné.
- Archivé.

Les transitions entre statuts doivent être contrôlées.

### 4. Détail d'un projet

En cliquant sur un projet, ouvrir une vue détaillée.

Elle doit présenter :
- Les paramètres initiaux.
- La progression.
- L'historique mensuel.
- Les contributions.
- Les écarts.
- Les commentaires.
- Les actions disponibles.

### 5. Actions

Permettre :
- Modifier un projet.
- Mettre en pause.
- Reprendre.
- Ajouter une contribution.
- Ajuster un objectif.
- Ajuster une date cible.
- Terminer.
- Archiver.

Conserver les anciennes valeurs et les changements importants dans l'historique.

Ne pas autoriser la suppression silencieuse d'un projet actif avec un historique associé.

---

## MODULE D — SUIVI MENSUEL PRÉVISIONNEL / RÉEL

C'est le cœur du produit.

Chaque projet actif doit disposer d'un suivi mensuel.

Pour chaque mois, conserver :

- Objectif mensuel initial.
- Contribution réellement réalisée.
- Écart.
- Cumul épargné.
- Reste à atteindre.
- Progression en pourcentage.
- État du mois.
- Commentaire facultatif.
- Date de validation.

### Exemple

Projet : ordinateur.

Objectif : 3 000 €.

Épargne initiale : 500 €.

Durée : 5 mois.

Effort prévu : 500 € par mois.

Prévision initiale :

| Mois | Prévision |
|---|---:|
| 1 | 500 € |
| 2 | 1 000 € |
| 3 | 1 500 € |
| 4 | 2 000 € |
| 5 | 2 500 € |

Après trois mois, l'utilisateur a réellement épargné 1 350 €.

L'application doit montrer :

- Prévision cumulée : 1 500 €.
- Réalisé : 1 350 €.
- Écart : -150 €.
- Progression par rapport à l'objectif total : 54 %.

L'utilisateur doit pouvoir expliquer ou corriger un mois.

### Validation mensuelle

Ne pas clôturer automatiquement un mois simplement parce que la date a changé.

Proposer une validation mensuelle.

L'utilisateur peut :
- Confirmer le montant réalisé.
- Corriger le montant.
- Ajouter une note.
- Signaler qu'il n'a pas pu épargner.
- Reporter une partie de son objectif.
- Ajuster les mois suivants.

Garder la prévision initiale pour mesurer les écarts.

Les ajustements doivent être enregistrés séparément.

---

## MODULE E — INTÉGRATION AU BUDGET ET AUX TRANSACTIONS

Ce module doit être conçu avec une attention particulière.

Il ne faut jamais fausser le budget réel.

### Règle financière fondamentale

Une somme mise de côté pour un projet n'est pas automatiquement une dépense de consommation.

Exemple :

L'utilisateur gagne 2 500 €.

Il dépense 1 800 €.

Il affecte 300 € à son projet voiture.

Les 300 € ne doivent pas être comptés une deuxième fois comme une dépense de consommation.

Il faut distinguer :

- Revenus.
- Dépenses.
- Transferts.
- Affectations à un projet.
- Contributions réellement réalisées.

### Connexion aux transactions

Lorsqu'une contribution est ajoutée, permettre :

- De la saisir manuellement.
- De la relier à une transaction existante, lorsque cela correspond réellement à l'opération.
- D'enregistrer une affectation interne sans inventer une dépense.
- De corriger une contribution.

Éviter absolument les doublons.

Une contribution liée à une transaction doit garder une référence vers celle-ci.

Une suppression ou modification de transaction liée doit être gérée proprement, sans supprimer silencieusement l'historique du projet.

### Cohérence

Les contributions d'un projet doivent être distinctes des dépenses de consommation.

Les sommes affectées à plusieurs projets ne doivent pas être considérées comme des ressources disponibles plusieurs fois.

Si l'utilisateur finance deux projets simultanément, l'application doit calculer l'effort global engagé.

---

## MODULE F — ASSISTANT FINANCIER ET RECOMMANDATIONS

Une fois les modules précédents fiables, développer un assistant d'analyse.

L'assistant doit utiliser les données réelles disponibles.

Exemples de messages :

- « Ton effort d'épargne actuel est supérieur à ta capacité moyenne observée. »
- « Tu as pris 150 € de retard sur ton objectif initial. »
- « En conservant ton rythme actuel, ton objectif serait atteint environ un mois plus tard. »
- « Tu peux réduire ton effort mensuel pour préserver une marge de sécurité. »
- « Tes dépenses ont augmenté par rapport à ta situation de référence. »

Les recommandations doivent être :
- Compréhensibles.
- Justifiées par des chiffres.
- Prudentes.
- Non culpabilisantes.
- Facultatives.

Ne pas intégrer d'intelligence artificielle externe payante sans me le demander.

Commencer par un moteur de règles déterministes, transparent et testable.

---

## MODULE G — GRAPHIQUES ET BILANS

Créer des graphiques utiles :

1. Prévision contre réalisation.
2. Progression cumulée.
3. Contributions mensuelles.
4. Évolution de la capacité d'épargne.
5. Écart par rapport à l'objectif.
6. Projection de date d'achèvement.

Utiliser Chart.js déjà présent dans l'application.

Ne pas ajouter une autre bibliothèque graphique sans nécessité.

### Bilan final

À la clôture d'un projet, produire un bilan contenant :

- Nom du projet.
- Objectif initial.
- Montant initial disponible.
- Montant final épargné.
- Durée prévue.
- Durée réelle.
- Date de début.
- Date de fin.
- Effort mensuel prévu.
- Contributions réalisées.
- Écarts mensuels.
- Évolution de la situation budgétaire.
- Événements importants.
- Résultat final.

L'utilisateur doit pouvoir consulter le bilan même après archivage.

Prévoir une possibilité d'export PDF si cela peut être réalisé proprement sans fragiliser le reste de l'application.

---

# 5. MODÈLE DE DONNÉES À ÉTUDIER ET À CONSTRUIRE

Avant de créer des tables, inspecte le schéma Supabase réel.

Les noms ci-dessous sont des propositions fonctionnelles, pas des tables dont l'existence est garantie.

Tu dois vérifier les tables existantes, les colonnes, les contraintes, les index et les politiques RLS.

Éviter les doublons de tables ou de données.

## Table de projets

Une structure possible :

`financings`

Champs à prévoir selon compatibilité avec l'existant :

- id
- user_id
- name
- description
- target_amount
- current_amount
- months
- monthly_effort
- target_date
- start_date
- status
- tracking_duration
- activated_at
- completed_at
- archived_at
- baseline_snapshot
- created_at
- updated_at

Conserver la compatibilité avec les colonnes actuellement exploitées lorsque c'est possible.

## Table de suivi mensuel

Structure possible :

`financing_months`

- id
- project_id
- user_id
- month
- planned_amount
- actual_amount
- variance
- status
- note
- validated_at
- created_at
- updated_at

## Table de contributions

Structure possible :

`financing_contributions`

- id
- project_id
- user_id
- month_id
- transaction_id
- amount
- contribution_date
- source
- note
- created_at

Le champ `transaction_id` peut être nul pour une contribution manuelle ou une affectation interne.

## Historique des modifications

Structure possible :

`financing_events`

- id
- project_id
- user_id
- event_type
- previous_value
- new_value
- description
- created_at

Ce modèle doit être adapté à la structure existante et à Supabase.

### Contraintes techniques

- Toutes les tables doivent avoir une isolation utilisateur.
- Toutes les relations doivent être cohérentes.
- Utiliser des clés étrangères lorsque pertinent.
- Ajouter des index utiles.
- Définir des règles RLS strictes.
- Prévenir les doublons.
- Prévoir les suppressions et modifications.
- Ne pas stocker des données financières dans un champ JSON arbitraire si une structure relationnelle est plus adaptée.
- Le snapshot initial peut être stocké en JSONB si son contenu est clairement défini et versionné.

Tous les montants doivent être enregistrés dans une unité monétaire cohérente. Privilégier les entiers en centimes dans le modèle de calcul.

Ne réalise aucune migration avant d'avoir expliqué ce qu'elle modifie et vérifié sa compatibilité avec les données existantes.

---

# 6. PLAN DE DÉVELOPPEMENT OBLIGATOIRE

Tu dois travailler dans cet ordre.

Ne saute aucune étape.

## PHASE 0 — AUDIT COMPLET

Avant d'écrire du code :

1. Lire intégralement tous les fichiers fournis.
2. Cartographier les fonctions existantes.
3. Repérer les dépendances.
4. Identifier les événements JavaScript.
5. Identifier les identifiants HTML utilisés.
6. Étudier les méthodes de `BudgetDB`.
7. Étudier les méthodes de `Finance`.
8. Identifier les incohérences.
9. Examiner les erreurs potentielles.
10. Identifier les risques pour les données existantes.

Vérifier particulièrement :

- Le fonctionnement de l'authentification.
- Les filtres de période.
- Les conversions euros/centimes.
- Le fonctionnement des budgets.
- Le fonctionnement de la table `financings`.
- Les règles de suppression.
- Les erreurs silencieuses.
- La gestion des projets après actualisation de la page.

Produire une cartographie technique concise.

Ne me demander une information que si elle est véritablement indispensable et impossible à déduire des fichiers ou à vérifier avec les outils disponibles.

Si le schéma Supabase manque, indique précisément les éléments à vérifier et prépare une migration compatible sans l'exécuter.

## PHASE 1 — CORRECTIONS ET STABILISATION

Corriger les problèmes existants avant d'ajouter les nouvelles fonctionnalités.

Notamment :

- Le bouton de soumission placé hors du formulaire.
- Les calculs pouvant provoquer une erreur lorsque l'épargne disponible dépasse l'objectif.
- La capacité d'épargne calculée à partir du mauvais filtre de période.
- La sauvegarde automatique d'une simulation sans consentement explicite.
- La gestion des statuts.
- Les erreurs de sauvegarde et de chargement.
- Les risques de doublons.

Ne change pas inutilement le design général.

## PHASE 2 — SIMULATEUR AMÉLIORÉ

Construire un simulateur fiable.

Tester plusieurs scénarios :

- Projet de 3 000 €, épargne de 500 €, durée de 5 mois.
- Projet déjà entièrement financé.
- Épargne initiale supérieure au montant cible.
- Montant restant très faible.
- Durée de 1 mois.
- Capacité mensuelle insuffisante.
- Aucune transaction disponible.

Livrer une simulation fonctionnelle.

## PHASE 3 — SAUVEGARDE ET ACTIVATION

Séparer les simulations des projets actifs.

Créer le parcours de confirmation et d'activation.

Enregistrer la photographie initiale de la situation financière.

Tester la persistance après déconnexion et reconnexion.

## PHASE 4 — GESTION DES PROJETS

Construire la page « Mes financements ».

Créer les statuts et les actions.

Créer le détail d'un projet.

Permettre de modifier un projet tout en conservant son historique.

## PHASE 5 — SUIVI MENSUEL

Créer le suivi prévisionnel/réel.

Permettre la validation manuelle.

Conserver les prévisions initiales.

Calculer les écarts et les retards.

Tester les changements d'objectif et les reports.

## PHASE 6 — CONNEXION AU BUDGET

Relier les contributions aux transactions lorsque cela est justifié.

Prévenir les doubles comptages.

Calculer la capacité d'épargne.

Prendre en compte les projets simultanés.

Tester la cohérence des soldes et des statistiques.

## PHASE 7 — ASSISTANT FINANCIER

Ajouter des analyses et recommandations basées sur les données réelles.

Expliquer les calculs utilisés.

Ne jamais inventer des données manquantes.

## PHASE 8 — BILANS ET ARCHIVAGE

Créer les graphiques, les bilans finaux et l'archivage.

Vérifier que l'historique reste accessible.

## PHASE 9 — TESTS ET VALIDATION FINALE

Effectuer une recette complète.

Tester :

- Création d'un compte.
- Connexion.
- Déconnexion.
- Création de transactions.
- Modification de transactions.
- Suppression de transactions.
- Création de catégories.
- Budgets.
- Simulations.
- Activation.
- Contributions.
- Validation mensuelle.
- Pause et reprise.
- Clôture.
- Archivage.
- Export.
- Reconnexion.
- Isolation des données entre utilisateurs.

Vérifier qu'aucune fonctionnalité existante n'a régressé.

---

# 7. EXIGENCES D'INTERFACE

Je veux une application moderne, professionnelle et agréable à utiliser.

Conserver l'identité visuelle existante de Mon Budget.

Ne pas refaire toute l'interface sans raison.

Le résultat doit être :
- Clair.
- Élégant.
- Responsive.
- Adapté au mobile.
- Cohérent avec les pages existantes.
- Facile à utiliser.
- Accessible.

Éviter les interfaces trop chargées.

Privilégier :
- Des cartes synthétiques.
- Des indicateurs compréhensibles.
- Des barres de progression.
- Des graphiques lisibles.
- Des statuts visuels.
- Des confirmations avant les opérations sensibles.
- Des messages d'erreur explicites.

L'utilisateur doit toujours comprendre ce qui est une prévision et ce qui est un montant réellement réalisé.

---

# 8. MÉTHODE DE TRAVAIL AVEC MOI

Je ne suis pas développeur professionnel.

Tu dois donc être très précis dans tes livraisons.

Je veux que tu avances réellement, pas que tu me donnes uniquement des conseils.

### Pour chaque phase :

1. Explique brièvement ce que tu vas modifier.
2. Identifie les fichiers concernés.
3. Réalise les modifications.
4. Fournis les fichiers complets modifiés.
5. Fournis les scripts SQL nécessaires si besoin.
6. Explique comment appliquer les changements.
7. Donne une liste de tests à effectuer.
8. Vérifie que les fonctionnalités précédentes restent intactes.
9. Passe à la phase suivante lorsque la précédente est cohérente.

Si tu as accès à un environnement de fichiers, modifie directement les fichiers du projet et vérifie les changements.

Si tu n'as pas accès à l'environnement, donne les fichiers complets, avec leur nom exact.

Ne me demande pas de copier des morceaux de code à des emplacements imprécis.

Ne me demande pas de répéter les informations déjà présentes dans les fichiers.

Ne me pose pas une série de questions de préférence avant de commencer.

Lorsqu'un détail non essentiel manque, prends une décision technique raisonnable, documente-la et continue.

Lorsqu'un point est réellement bloquant, explique exactement pourquoi et demande uniquement l'information indispensable.

Ne prétends jamais avoir exécuté un test que tu n'as pas réellement exécuté.

---

# 9. LIVRABLE FINAL

À la fin du projet, je veux obtenir :

1. Une application Mon Budget complète et fonctionnelle.
2. Le simulateur de financement amélioré.
3. La gestion complète des projets.
4. Le suivi mensuel prévisionnel/réel.
5. L'intégration cohérente avec les transactions.
6. L'assistant financier basé sur les données réelles.
7. Les bilans et l'archivage.
8. Les fichiers HTML, CSS et JavaScript complets.
9. Les migrations SQL nécessaires.
10. Les règles RLS nécessaires.
11. Une procédure d'installation.
12. Une procédure de sauvegarde et de restauration.
13. Une liste de tests de validation.
14. Une liste des éventuelles limites restantes.

L'application doit pouvoir continuer à fonctionner avec les comptes et données existants.

---

# 10. TA PREMIÈRE MISSION : COMMENCER MAINTENANT

Ne commence pas par me présenter une nouvelle feuille de route théorique.

La feuille de route est déjà définie dans ce prompt.

Commence immédiatement par la PHASE 0.

Tu dois :

1. Lire les fichiers fournis.
2. Examiner leur structure réelle.
3. Cartographier l'architecture.
4. Identifier les problèmes prioritaires.
5. Vérifier les possibilités de compatibilité avec Supabase.
6. Déterminer les migrations éventuellement nécessaires.
7. Préparer le premier lot de corrections.

Puis commence la PHASE 1 dès que l'audit permet de le faire sans risque.

**Je veux que tu sois orienté réalisation, pas seulement conseil.**

L'objectif est de transformer progressivement mon application actuelle en un véritable assistant de financement personnel, robuste, fiable, évolutif et prêt à être utilisé par de vrais utilisateurs.

Tu dois privilégier la fiabilité financière, la sécurité des données et la conservation de l'existant à la vitesse de développement.