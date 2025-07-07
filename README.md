# Plateforme de Gestion des Demandes

## Description
Cette plateforme permet de gérer les demandes d'équipement et de matériel dans un établissement éducatif selon un workflow hiérarchique.

## Rôles et Workflow

### 1. Directeur 👑
- **Responsabilités** :
  - Créer des listes de demandes ouvertes
  - Définir les catégories d'équipement
  - Gérer les départements
  - Approuver/rejeter les demandes après validation par les chefs de département

### 2. Chef de département 🏢
- **Responsabilités** :
  - Évaluer les demandes des enseignants de son département
  - Approuver/rejeter les demandes selon les priorités
  - Les demandes approuvées remontent au directeur
  - Les demandes rejetées n'atteignent pas le directeur

### 3. Enseignant 👨‍🏫
- **Responsabilités** :
  - Soumettre des demandes d'équipement/matériel
  - Suivre le statut de ses demandes
  - Voir l'historique des évaluations

## Architecture Technique

### Base de données
- **MySQL** avec les tables :
  - `users` : Utilisateurs et leurs rôles
  - `departments` : Départements
  - `categories` : Catégories d'équipement
  - `demand_lists` : Listes de demandes ouvertes par le directeur
  - `demands` : Demandes individuelles
  - `demand_evaluations` : Historique des évaluations

### Backend
- **Node.js** avec Express
- **JWT** pour l'authentification
- **bcrypt** pour le hachage des mots de passe
- **CORS** configuré pour le frontend

### Frontend
- **React** avec Material-UI
- **React Router** pour la navigation
- **Axios** pour les requêtes API

## Installation et Configuration

### 1. Base de données
```bash
# Créer la base de données
mysql -u root -p < bd_demandes.sql
```

### 2. Backend
```bash
cd back-end
npm install
```

Créer un fichier `.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=projet-bah
DB_PORT=3306
PORT=3000
```

Démarrer le serveur :
```bash
node serveur_demandes.js
```

### 3. Frontend
```bash
cd front-end
npm install
npm run dev
```

## Utilisation

### 1. Première utilisation
1. Accédez à `/register` pour créer les comptes utilisateurs
2. Le directeur doit d'abord créer les départements et catégories
3. Les chefs de département et enseignants peuvent ensuite s'inscrire

### 2. Workflow type
1. **Directeur** : Crée une liste de demandes avec une date limite
2. **Enseignants** : Soumettent leurs demandes dans la liste ouverte
3. **Chef de département** : Évalue les demandes de son département
4. **Directeur** : Prend les décisions finales sur les demandes approuvées

### 3. Suivi des demandes
- Les enseignants peuvent suivre le statut de leurs demandes
- L'historique des évaluations est conservé
- Les notifications de statut sont visibles en temps réel

## Fonctionnalités principales

### Pour le Directeur
- Tableau de bord avec statistiques
- Gestion des listes de demandes
- Gestion des catégories et départements
- Évaluation des demandes finales

### Pour les Chefs de département
- Liste des demandes de leur département
- Outils d'évaluation avec commentaires
- Suivi des demandes traitées

### Pour les Enseignants
- Création de demandes avec justification
- Suivi en temps réel du statut
- Historique complet des évaluations

## Sécurité
- Authentification JWT
- Autorisation basée sur les rôles
- Validation des données côté serveur
- Protection contre les injections SQL

## Améliorations futures possibles
- Système de notifications par email
- Gestion des budgets par département
- Rapports et exports PDF
- Interface mobile
- Workflow de commande après approbation
- Intégration avec un système de comptabilité

---

## Migration depuis l'ancien système

Le projet a été adapté depuis une plateforme de gestion d'examens vers une plateforme de gestion de demandes. Les principales modifications incluent :

1. **Nouveau schéma de base de données** adapté au workflow de demandes
2. **Nouveaux rôles utilisateurs** (directeur, chef de département, enseignant)
3. **Interface utilisateur repensée** pour chaque rôle
4. **Workflow hiérarchique** pour l'approbation des demandes
5. **Système de suivi** des demandes en temps réel
