# Démo en ligne

Le site de démonstration est disponible à l'adresse suivante :
**https://bah.moustaphaniang.com**

## Identifiants de connexion

Utilisez l'un des logins suivants (mot de passe pour tous : `passer`) :

- directeur
- chef.meca
- prof.meca
- prof.info
- chef.info

# 🏫 Plateforme de Gestion des Demandes d'Équipement

## 📋 Description
Cette plateforme permet de gérer les demandes d'équipement et de matériel dans un établissement éducatif selon un workflow hiérarchique. Elle offre une solution complète avec gestion des utilisateurs, automatisation des processus, traçabilité complète et système de notifications.

## 📚 Table des Matières

### 🎯 [Fonctionnalités Principales](#-fonctionnalités-principales)
- [🔐 Authentification et Gestion des Utilisateurs](#-authentification-et-gestion-des-utilisateurs)
- [🏢 Gestion des Départements](#-gestion-des-départements)
- [📂 Gestion des Catégories](#-gestion-des-catégories)
- [📋 Gestion des Listes de Demandes](#-gestion-des-listes-de-demandes)
- [📝 Soumission et Suivi des Demandes](#-soumission-et-suivi-des-demandes)
- [✅ Système de Validation Hiérarchique](#-système-de-validation-hiérarchique)
- [📊 Tableau de Bord et Statistiques](#-tableau-de-bord-et-statistiques)
- [📈 Exports et Rapports](#-exports-et-rapports)
- [🕒 Gestion Automatique des Dates Limites](#-gestion-automatique-des-dates-limites)
- [📧 Notifications Email](#-notifications-email)
- [🔍 Traçabilité Complète](#-traçabilité-complète)
- [💰 Affichage en Devise Locale (FCFA)](#-affichage-en-devise-locale-fcfa)

### 👥 [Rôles et Permissions](#-rôles-et-permissions)
- [👑 Directeur](#-directeur)
- [🏢 Chef de Département](#-chef-de-département)
- [👨‍🏫 Enseignant](#-enseignant)

### 🔧 [Installation et Configuration](#-installation-et-configuration)
- [🗄️ Base de Données](#-base-de-données)
- [⚙️ Backend](#-backend)
- [🌐 Frontend](#-frontend)

### �️ [Architecture Technique](#-architecture-technique)
- [💾 Structure de la Base de Données](#-structure-de-la-base-de-données)
- [🔧 Technologies Utilisées](#-technologies-utilisées)

### 📖 [Guide d'Utilisation](#-guide-dutilisation)
- [🚀 Première Utilisation](#-première-utilisation)
- [🔄 Workflow Type](#-workflow-type)

### 🔒 [Sécurité](#-sécurité)

---

## 🎯 Fonctionnalités Principales

### 🔐 Authentification et Gestion des Utilisateurs
- **Inscription sécurisée** avec validation des données
- **Authentification JWT** avec tokens sécurisés
- **Gestion complète des utilisateurs** par le directeur
- **Création automatique de comptes** avec envoi d'email contenant les identifiants
- **Hashage des mots de passe** avec bcrypt
- **Gestion des rôles** : Directeur, Chef de département, Enseignant
- **Interface d'administration** pour la gestion des utilisateurs

### 🏢 Gestion des Départements
- **Création et modification** des départements
- **Attribution des chefs de département**
- **Gestion des enseignants** par département
- **Affichage hiérarchique** des départements dans l'interface

### 📂 Gestion des Catégories
- **Système de catégories hiérarchiques** avec sous-catégories
- **Interface intuitive** pour la création et modification
- **Organisation logique** des équipements par catégorie
- **Gestion des relations parent-enfant** entre catégories

### 📋 Gestion des Listes de Demandes
- **Création de listes** avec date limite personnalisable
- **Saisie de date intuitive** au format DD/MM/YY avec validation
- **Heure limite automatique** à 23h59 pour chaque liste
- **Statut des listes** : Ouverte, Fermée, Expirée
- **Affichage du temps restant** avec codes couleur :
  - 🟢 Vert : Plus de 5 jours
  - 🟡 Jaune : 2-5 jours
  - 🔴 Rouge : Moins de 2 jours
- **Fermeture automatique** des listes expirées

### 📝 Soumission et Suivi des Demandes
- **Interface de soumission** simple et intuitive
- **Justification obligatoire** pour chaque demande
- **Suivi en temps réel** du statut des demandes
- **Historique complet** des évaluations
- **Affichage des montants** en FCFA
- **Modification possible** avant validation

### ✅ Système de Validation Hiérarchique
- **Validation en deux étapes** : Chef de département → Directeur
- **Commentaires obligatoires** pour les rejets
- **Traçabilité complète** des décisions
- **Notifications automatiques** à chaque étape
- **Workflow sécurisé** avec vérifications des permissions

### 📊 Tableau de Bord et Statistiques
- **Vue d'ensemble** des demandes par statut
- **Statistiques par département** et par catégorie
- **Graphiques interactifs** pour la visualisation
- **Filtres avancés** pour l'analyse
- **Indicateurs de performance** du workflow

### 📈 Exports et Rapports
- **Export CSV/Excel** pour chaque liste fermée
- **Bouton d'export** disponible uniquement pour les listes terminées
- **Rapport détaillé** avec toutes les informations de traçabilité
- **Format personnalisable** selon les besoins

### 🕒 Gestion Automatique des Dates Limites
- **Vérification automatique** toutes les heures
- **Fermeture automatique** des listes expirées
- **Notification email** au directeur lors de la fermeture
- **Bouton de vérification manuelle** pour forcer la vérification
- **Logs détaillés** des actions automatiques

### 📧 Notifications Email
- **Configuration SMTP** flexible
- **Email de bienvenue** avec identifiants lors de la création d'un compte
- **Notifications d'expiration** des listes
- **Alertes automatiques** pour les événements importants
- **Templates personnalisables** pour les emails

### 🔍 Traçabilité Complète
- **Historique détaillé** de toutes les évaluations
- **Information sur l'évaluateur** (qui, quand, commentaire)
- **Horodatage précis** de chaque action
- **Audit trail** complet pour la conformité
- **Conservation permanente** des données historiques

### 💰 Affichage en Devise Locale (FCFA)
- **Formatage automatique** des montants en FCFA
- **Affichage cohérent** dans toute l'interface
- **Validation des montants** avec contrôles appropriés
- **Calculs automatiques** des totaux par liste

---

## 👥 Rôles et Permissions

### 👑 Directeur
**Permissions complètes** sur la plateforme :
- ✅ Créer et gérer les listes de demandes
- ✅ Définir les catégories d'équipement
- ✅ Gérer les départements et leurs chefs
- ✅ Créer et gérer tous les utilisateurs
- ✅ Approuver/rejeter les demandes validées par les chefs
- ✅ Accéder à toutes les statistiques et rapports
- ✅ Exporter les données des listes fermées
- ✅ Forcer la vérification des listes expirées

### 🏢 Chef de Département
**Permissions limitées** à son département :
- ✅ Voir les demandes de son département uniquement
- ✅ Évaluer les demandes de ses enseignants
- ✅ Approuver/rejeter avec commentaires obligatoires
- ✅ Accéder aux statistiques de son département
- ❌ Créer des utilisateurs ou gérer d'autres départements
- ❌ Accéder aux demandes d'autres départements

### 👨‍🏫 Enseignant
**Permissions basiques** pour ses propres demandes :
- ✅ Soumettre des demandes dans les listes ouvertes
- ✅ Suivre le statut de ses demandes
- ✅ Voir l'historique complet de ses évaluations
- ✅ Modifier ses demandes avant validation
- ❌ Voir les demandes d'autres enseignants
- ❌ Accéder aux fonctions d'administration

---

## 🔧 Installation et Configuration

### 🗄️ Base de Données
```bash
# Créer la base de données MySQL
mysql -u root -p < bd.sql
```

### ⚙️ Backend
```bash
cd back-end
npm install
```

Créer un fichier `.env` avec la configuration :
```env
# Configuration de la base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=projet-bah
DB_PORT=3306

# Configuration du serveur
PORT=3000
JWT_SECRET=your_jwt_secret_key

# Configuration email (obligatoire pour les notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=Plateforme de Gestion des Demandes
```

Démarrer le serveur :
```bash
node serveur.js
```

### 🌐 Frontend
```bash
cd front-end
npm install
npm run dev
```

---

## 🏗️ Architecture Technique

### 💾 Structure de la Base de Données
- **`users`** : Utilisateurs avec rôles et départements
- **`departments`** : Départements de l'établissement
- **`categories`** : Catégories hiérarchiques d'équipement
- **`demand_lists`** : Listes de demandes avec dates limites
- **`demands`** : Demandes individuelles avec montants
- **`demand_evaluations`** : Historique complet des évaluations

### 🔧 Technologies Utilisées
**Backend :**
- Node.js avec Express.js
- MySQL avec requêtes sécurisées
- JWT pour l'authentification
- bcrypt pour le hachage des mots de passe
- Nodemailer pour les emails
- Cron pour l'automatisation

**Frontend :**
- React avec hooks modernes
- Material-UI pour l'interface
- React Router pour la navigation
- Axios pour les requêtes API
- Gestion d'état avec Context API

---

## 📖 Guide d'Utilisation

### 🚀 Première Utilisation
1. **Installation** : Suivez les étapes d'installation ci-dessus
2. **Configuration** : Créez le fichier `.env` avec vos paramètres
3. **Base de données** : Importez le fichier `bd.sql`
4. **Démarrage** : Lancez le backend puis le frontend
5. **Accès** : Utilisez les comptes par défaut ou créez-en de nouveaux

### 🔄 Workflow Type
1. **Directeur** : Crée une liste de demandes avec date limite
2. **Enseignants** : Soumettent leurs demandes dans la liste ouverte
3. **Chef de département** : Évalue les demandes de son département
4. **Directeur** : Prend les décisions finales sur les demandes approuvées
5. **Système** : Ferme automatiquement les listes expirées
6. **Export** : Génération des rapports pour les listes fermées

---

## 🔒 Sécurité

### Mesures de Protection
- **Authentification JWT** avec expiration des tokens
- **Autorisation basée sur les rôles** avec vérifications strictes
- **Validation des données** côté serveur et client
- **Protection contre les injections SQL** avec requêtes préparées
- **Hashage sécurisé** des mots de passe avec bcrypt
- **CORS configuré** pour les domaines autorisés
- **Validation des permissions** à chaque requête
- **Logs de sécurité** pour l'audit

### Bonnes Pratiques Implémentées
- Variables d'environnement pour les configurations sensibles
- Tokens JWT avec durée de vie limitée
- Validation des entrées utilisateur
- Gestion sécurisée des erreurs
- Protection contre les attaques CSRF
- Chiffrement des communications

---

**Développé avec ❤️ pour une gestion efficace des demandes d'équipement (Et une bonne note)**
