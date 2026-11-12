-- Base de Second Souffle : à importer dans phpMyAdmin (onglet Importer).
-- Crée la base second_souffle (utf8mb4, InnoDB) et ses quatre tables.

CREATE DATABASE IF NOT EXISTS second_souffle
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE second_souffle;

-- Un joueur = un navigateur (identifiant créé par le serveur, gardé dans localStorage)
CREATE TABLE IF NOT EXISTS players (
  id CHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Polluants débloqués par chaque joueur
CREATE TABLE IF NOT EXISTS unlocks (
  player_id CHAR(32) NOT NULL,
  polluant_id VARCHAR(4) NOT NULL,
  unlocked_at DATETIME(3) NOT NULL,
  PRIMARY KEY (player_id, polluant_id),
  CONSTRAINT fk_unlocks_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Parties : jeton à usage unique ; score et pseudo remplis à l'envoi du score
CREATE TABLE IF NOT EXISTS games (
  token CHAR(32) NOT NULL,
  player_id CHAR(32) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  finished_at DATETIME(3) NULL,
  score INT UNSIGNED NULL,
  pseudo VARCHAR(15) NULL,
  PRIMARY KEY (token),
  KEY idx_games_player (player_id),
  KEY idx_games_classement (score, finished_at),
  CONSTRAINT fk_games_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Limitation de débit : un compteur par (seau, début de fenêtre en secondes Unix)
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket VARCHAR(100) NOT NULL,
  window_start INT UNSIGNED NOT NULL,
  count INT UNSIGNED NOT NULL,
  PRIMARY KEY (bucket, window_start)
) ENGINE=InnoDB;
