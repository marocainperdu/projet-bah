-- Base de données pour la plateforme de gestion de demandes
-- Mise à jour de la structure existante

CREATE DATABASE IF NOT EXISTS `projet-bah`;
USE `projet-bah`;

-- Table des départements
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des catégories de besoins
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL, -- code comptable (ex: 60411, 6047, etc.)
  `name` varchar(255) NOT NULL,
  `description` text,
  `parent_id` int NULL, -- pour la hiérarchie des catégories
  `level` int NOT NULL DEFAULT 1, -- niveau dans la hiérarchie (1=classe, 2=compte, 3=sous-compte, etc.)
  `type` enum('ordinaire','extraordinaire') NOT NULL DEFAULT 'ordinaire',
  `section` enum('fonctionnement','investissement') NOT NULL DEFAULT 'fonctionnement',
  `created_by` int NOT NULL, -- référence vers un directeur
  `is_active` boolean DEFAULT true,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des utilisateurs (mise à jour des rôles)
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('director','department_head','teacher') NOT NULL,
  `department_id` int NULL, -- null pour le directeur
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des listes de besoins ouvertes par le directeur
CREATE TABLE `demand_lists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `created_by` int NOT NULL, -- référence vers le directeur
  `status` enum('open','closed','completed') DEFAULT 'open',
  `deadline` timestamp NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des demandes individuelles
CREATE TABLE `demands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demand_list_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `category_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `quantity` int NOT NULL DEFAULT 1,
  `estimated_price` decimal(10,2) NOT NULL,
  `justification` text,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','approved_by_head','rejected_by_head','approved_by_director','rejected_by_director') DEFAULT 'pending',
  `evaluated_by_head` int NULL, -- ID du chef de département qui a évalué
  `evaluated_by_director` int NULL, -- ID du directeur qui a évalué
  `head_evaluation_date` timestamp NULL, -- Date d'évaluation par le chef
  `director_evaluation_date` timestamp NULL, -- Date d'évaluation par le directeur
  `head_comments` text, -- Commentaires du chef de département
  `director_comments` text, -- Commentaires du directeur
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_list_id` (`demand_list_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `category_id` (`category_id`),
  KEY `evaluated_by_head` (`evaluated_by_head`),
  KEY `evaluated_by_director` (`evaluated_by_director`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des évaluations/commentaires sur les demandes
CREATE TABLE `demand_evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demand_id` int NOT NULL,
  `evaluator_id` int NOT NULL,
  `evaluator_role` enum('department_head','director') NOT NULL,
  `decision` enum('approved','rejected') NOT NULL,
  `comments` text,
  `evaluated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_id` (`demand_id`),
  KEY `evaluator_id` (`evaluator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Contraintes de clés étrangères
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

ALTER TABLE `demand_lists`
  ADD CONSTRAINT `demand_lists_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `demands`
  ADD CONSTRAINT `demands_ibfk_1` FOREIGN KEY (`demand_list_id`) REFERENCES `demand_lists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demands_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demands_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demands_ibfk_4` FOREIGN KEY (`evaluated_by_head`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `demands_ibfk_5` FOREIGN KEY (`evaluated_by_director`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `demand_evaluations`
  ADD CONSTRAINT `demand_evaluations_ibfk_1` FOREIGN KEY (`demand_id`) REFERENCES `demands` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demand_evaluations_ibfk_2` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Données de test
INSERT INTO `departments` (`name`, `description`) VALUES
('Génie Chimique et Biologie Appliquée', 'Département de génie chimique et biologie appliquée'),
('Génie Civil', 'Département de génie civil'),
('Génie Électrique', 'Département de génie électrique'),
('Génie Informatique', 'Département de génie informatique'),
('Génie Mécanique', 'Département de génie mécanique'),
('Gestion', 'Département de gestion');

INSERT INTO `users` (`email`, `password`, `name`, `role`, `department_id`) VALUES
('directeur@ecole.com', '$2b$10$KrFpdqXCjMaToY5jZEddTe0GESZ4ghQ3KFmJDQY5PmVRvquhts7SO', 'Directeur Principal', 'director', NULL),
('chef.meca@ecole.com', '$2b$10$KrFpdqXCjMaToY5jZEddTe0GESZ4ghQ3KFmJDQY5PmVRvquhts7SO', 'Chef Génie Mécanique', 'department_head', 5),
('prof.meca@ecole.com', '$2b$10$KrFpdqXCjMaToY5jZEddTe0GESZ4ghQ3KFmJDQY5PmVRvquhts7SO', 'Prof Génie Mécanique', 'teacher', 5),
('prof.info@ecole.com', '$2b$10$KrFpdqXCjMaToY5jZEddTe0GESZ4ghQ3KFmJDQY5PmVRvquhts7SO', 'Prof Génie Informatique', 'teacher', 4),
('chef.info@ecole.com', '$2b$10$KrFpdqXCjMaToY5jZEddTe0GESZ4ghQ3KFmJDQY5PmVRvquhts7SO', 'Chef Génie Informatique', 'department_head', 4);

INSERT INTO `categories` (`code`, `name`, `description`, `parent_id`, `level`, `type`, `section`, `created_by`) VALUES
-- DÉPENSES ORDINAIRES - Section Fonctionnement
-- Classe 60 - Achats et variations de stocks (ID=1)
('60', 'Achats et variations de stocks', 'Comptes des achats', NULL, 1, 'ordinaire', 'fonctionnement', 1),
-- Sous-classes de 60 (ID=2)
('604', 'Achats stockés de matières et fournitures consommables', 'Matières et fournitures stockées', 1, 2, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 604 (ID=3,4,5,6)
('6041', 'Matières consommables', 'Matières consommables diverses', 2, 3, 'ordinaire', 'fonctionnement', 1),
('6043', 'Produits d\'entretien', 'Produits de nettoyage et entretien', 2, 3, 'ordinaire', 'fonctionnement', 1),
('6047', 'Fournitures de bureau', 'Papeterie, stylos, etc.', 2, 3, 'ordinaire', 'fonctionnement', 1),
('6048', 'Autres achats stockés matières', 'Autres matières stockées', 2, 3, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 6041 (ID=7)
('60411', 'Consommables informatiques', 'Cartouches, CD, clés USB, etc.', 3, 4, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 6048 (ID=8)
('60481', 'Achats imprimés et cartes', 'Documents imprimés, cartes diverses', 6, 4, 'ordinaire', 'fonctionnement', 1),
-- Sous-classe de 60 (ID=9)
('605', 'Autres achats', 'Achats non stockés', 1, 2, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 605 (ID=10,11,12,13,14,15)
('6051', 'Fournitures non stockables – Eau', 'Consommation d\'eau', 9, 3, 'ordinaire', 'fonctionnement', 1),
('6052', 'Fournitures non stockables – Électricité', 'Consommation électrique', 9, 3, 'ordinaire', 'fonctionnement', 1),
('6053', 'Fournitures non stockables – Autres énergies', 'Gaz, carburants, etc.', 9, 3, 'ordinaire', 'fonctionnement', 1),
('6056', 'Achat de petits matériels et outillages', 'Petit matériel non immobilisable', 9, 3, 'ordinaire', 'fonctionnement', 1),
('6057', 'Achat d\'études et de prestations de services', 'Services externes', 9, 3, 'ordinaire', 'fonctionnement', 1),
('6058', 'Achats de travaux, matériels et équipements', 'Travaux et équipements', 9, 3, 'ordinaire', 'fonctionnement', 1),

-- Classe 61 - Transports (ID=16)
('61', 'Transports', 'Frais de transport', NULL, 1, 'ordinaire', 'fonctionnement', 1),
-- Sous-classes de 61 (ID=17,18,19)
('614', 'Transports du Personnel', 'Transport des employés', 16, 2, 'ordinaire', 'fonctionnement', 1),
('616', 'Transport de plis', 'Courrier et colis', 16, 2, 'ordinaire', 'fonctionnement', 1),
('618', 'Autres frais de transport', 'Voyages et déplacements', 16, 2, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 618 (ID=20)
('6181', 'Voyages et déplacements', 'Missions et voyages', 19, 3, 'ordinaire', 'fonctionnement', 1),

-- Classe 62 - Services extérieurs A (ID=21)
('62', 'Services extérieurs A', 'Services externes type A', NULL, 1, 'ordinaire', 'fonctionnement', 1),
-- Sous-classes de 62 (ID=22,23,24,25,26,27)
('622', 'Location et Charges Locatives', 'Loyers et charges', 21, 2, 'ordinaire', 'fonctionnement', 1),
('624', 'Entretien, Réparations et Maintenance', 'Maintenance et réparations', 21, 2, 'ordinaire', 'fonctionnement', 1),
('625', 'Primes d\'assurances', 'Assurances diverses', 21, 2, 'ordinaire', 'fonctionnement', 1),
('626', 'Études, recherche et Documentation', 'Documentation et recherche', 21, 2, 'ordinaire', 'fonctionnement', 1),
('627', 'Publicité, publication et relations publiques', 'Communication', 21, 2, 'ordinaire', 'fonctionnement', 1),
('628', 'Frais de télécommunications', 'Téléphone, internet', 21, 2, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 624 (ID=28,29,30)
('6241', 'Entretien, réparations et maintenance de biens immobiliers', 'Entretien bâtiments', 23, 3, 'ordinaire', 'fonctionnement', 1),
('6242', 'Entretien et réparation de biens mobiliers', 'Entretien mobilier', 23, 3, 'ordinaire', 'fonctionnement', 1),
('6243', 'Maintenance', 'Contrats de maintenance', 23, 3, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 626 (ID=31,32)
('6261', 'Études et recherche', 'Frais d\'études', 25, 3, 'ordinaire', 'fonctionnement', 1),
('6265', 'Documentation générale', 'Livres et documentation', 25, 3, 'ordinaire', 'fonctionnement', 1),
-- Sous-comptes de 628 (ID=33,34)
('6281', 'Frais de téléphone', 'Communications téléphoniques', 27, 3, 'ordinaire', 'fonctionnement', 1),
('6284', 'Internet ADSL', 'Connexions internet', 27, 3, 'ordinaire', 'fonctionnement', 1),

-- Classe 63 - Services extérieurs B (ID=35)
('63', 'Services extérieurs B', 'Services externes type B', NULL, 1, 'ordinaire', 'fonctionnement', 1),
-- Sous-classes de 63 (ID=36,37,38,39)
('631', 'Frais bancaires', 'Frais de banque', 35, 2, 'ordinaire', 'fonctionnement', 1),
('632', 'Rémunération d\'intermédiaires et de Conseils', 'Honoraires et conseils', 35, 2, 'ordinaire', 'fonctionnement', 1),
('633', 'Frais de formation du Personnel', 'Formation continue', 35, 2, 'ordinaire', 'fonctionnement', 1),
('634', 'Redevances pour brevet, licence, logiciel et droits similaires', 'Licences logicielles', 35, 2, 'ordinaire', 'fonctionnement', 1),

-- DÉPENSES EXTRAORDINAIRES - Section Investissement
-- Classe 21 - Immobilisations incorporelles (ID=40)
('21', 'Immobilisations incorporelles', 'Actifs incorporels', NULL, 1, 'extraordinaire', 'investissement', 1),
-- Sous-classes de 21 (ID=41,42,43)
('211', 'Frais de recherche et de développement', 'R&D', 40, 2, 'extraordinaire', 'investissement', 1),
('212', 'Brevets, licences, concessions et droits similaires', 'Propriété intellectuelle', 40, 2, 'extraordinaire', 'investissement', 1),
('213', 'Logiciels', 'Licences logicielles capitalisées', 40, 2, 'extraordinaire', 'investissement', 1),

-- Classe 23 - Bâtiments, installations techniques (ID=44)
('23', 'Bâtiments, installations techniques et agencements', 'Infrastructure', NULL, 1, 'extraordinaire', 'investissement', 1),
-- Sous-classes de 23 (ID=45,46)
('231', 'Bâtiments ind., agri., adm. et com. sur sols propres', 'Constructions', 44, 2, 'extraordinaire', 'investissement', 1),
('235', 'Aménagements de Bureaux', 'Aménagements', 44, 2, 'extraordinaire', 'investissement', 1),

-- Classe 24 - Matériel (ID=47)
('24', 'Matériel', 'Équipements et matériels', NULL, 1, 'extraordinaire', 'investissement', 1),
-- Sous-classes de 24 (ID=48,49,50,51)
('241', 'Matériel et outillage industriel', 'Équipements industriels', 47, 2, 'extraordinaire', 'investissement', 1),
('244', 'Matériel et Mobilier', 'Mobilier et équipements', 47, 2, 'extraordinaire', 'investissement', 1),
('245', 'Matériel de Transport', 'Véhicules', 47, 2, 'extraordinaire', 'investissement', 1),
('248', 'Autres Matériels', 'Équipements divers', 47, 2, 'extraordinaire', 'investissement', 1),
-- Sous-comptes de 244 (ID=52,53,54,55)
('2441', 'Matériel de bureau', 'Équipements de bureau', 49, 3, 'extraordinaire', 'investissement', 1),
('2442', 'Matériel informatique', 'Ordinateurs, serveurs, réseaux', 49, 3, 'extraordinaire', 'investissement', 1),
('2443', 'Matériel bureautique', 'Imprimantes, scanners, etc.', 49, 3, 'extraordinaire', 'investissement', 1),
('2444', 'Mobilier de bureau', 'Bureaux, chaises, armoires', 49, 3, 'extraordinaire', 'investissement', 1),
-- Sous-comptes de 248 (ID=56)
('2482', 'Matériels de cours et de TP', 'Équipements pédagogiques', 51, 3, 'extraordinaire', 'investissement', 1);

-- Mot de passe pour tous les utilisateurs de test : "password123"
-- Hash généré avec bcrypt : $2b$10$KrFpdqXCjMaToY5jZEddTe0GESZ4ghQ3KFmJDQY5PmVRvquhts7SO
