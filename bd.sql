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
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_by` int NOT NULL, -- référence vers un directeur
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
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
  `status` enum('open','closed') DEFAULT 'open',
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
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_list_id` (`demand_list_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `category_id` (`category_id`)
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
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

ALTER TABLE `demand_lists`
  ADD CONSTRAINT `demand_lists_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `demands`
  ADD CONSTRAINT `demands_ibfk_1` FOREIGN KEY (`demand_list_id`) REFERENCES `demand_lists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demands_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demands_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

ALTER TABLE `demand_evaluations`
  ADD CONSTRAINT `demand_evaluations_ibfk_1` FOREIGN KEY (`demand_id`) REFERENCES `demands` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demand_evaluations_ibfk_2` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Données de test
INSERT INTO `departments` (`name`, `description`) VALUES
('Informatique', 'Département d\'informatique et technologies'),
('Mathématiques', 'Département de mathématiques'),
('Physique', 'Département de physique'),
('Chimie', 'Département de chimie');

INSERT INTO `users` (`email`, `password`, `name`, `role`, `department_id`) VALUES
('directeur@ecole.com', '$2b$10$hash', 'Directeur Principal', 'director', NULL),
('chef.info@ecole.com', '$2b$10$hash', 'Chef Info', 'department_head', 1),
('chef.math@ecole.com', '$2b$10$hash', 'Chef Math', 'department_head', 2),
('prof.info@ecole.com', '$2b$10$hash', 'Prof Info', 'teacher', 1),
('prof.math@ecole.com', '$2b$10$hash', 'Prof Math', 'teacher', 2);

INSERT INTO `categories` (`name`, `description`, `created_by`) VALUES
('Matériel informatique', 'Ordinateurs, serveurs, équipements réseau', 1),
('Logiciels', 'Licences logicielles, abonnements', 1),
('Mobilier', 'Bureaux, chaises, armoires', 1),
('Fournitures', 'Papeterie, consommables', 1),
('Équipement pédagogique', 'Tableaux, projecteurs, matériel de cours', 1);
