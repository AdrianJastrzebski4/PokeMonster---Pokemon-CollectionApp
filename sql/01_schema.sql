CREATE DATABASE IF NOT EXISTS PokeMonster
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE PokeMonster;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ogloszenie;
DROP TABLE IF EXISTS karty_w_danej_kolekcji;
DROP TABLE IF EXISTS karty;
DROP TABLE IF EXISTS uzytkownicy;
DROP TABLE IF EXISTS rola;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE rola (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nazwa VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE uzytkownicy (
  id INT AUTO_INCREMENT PRIMARY KEY,
  imie VARCHAR(20) NOT NULL,
  nazwisko VARCHAR(20) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  haslo VARCHAR(255) NOT NULL,
  rola_id INT NOT NULL,

  CONSTRAINT fk_uzytkownicy_rola
    FOREIGN KEY (rola_id)
    REFERENCES rola(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE karty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nazwa_kart VARCHAR(60) NOT NULL,
  numer_kart INT NOT NULL,

  UNIQUE KEY uq_karty_nazwa_numer (nazwa_kart, numer_kart)
);

CREATE TABLE karty_w_danej_kolekcji (
  id INT AUTO_INCREMENT PRIMARY KEY,

  uzytkownicy_id INT NOT NULL,
  karty_id INT NOT NULL,

  ocena_karty INT NOT NULL,
  wyslana_do_oceny DATE NULL,
  odeslana_z_oceny DATE NULL,
  cena DECIMAL(10,2) NULL,

  CONSTRAINT fk_kwdk_uzytkownik
    FOREIGN KEY (uzytkownicy_id)
    REFERENCES uzytkownicy(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_kwdk_karta
    FOREIGN KEY (karty_id)
    REFERENCES karty(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  KEY idx_kwdk_user (uzytkownicy_id),
  KEY idx_kwdk_karta (karty_id)
);


  CREATE TABLE ogloszenie (
    id INT AUTO_INCREMENT PRIMARY KEY,

    typ VARCHAR(20) NOT NULL,     
    cena DECIMAL(10,2) NULL,      
    status VARCHAR(20) NOT NULL,   

    karty_w_danej_kolekcji_id INT NOT NULL,

  CONSTRAINT fk_ogloszenie_kwdk
    FOREIGN KEY (karty_w_danej_kolekcji_id)
    REFERENCES karty_w_danej_kolekcji(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  KEY idx_ogloszenie_typ (typ),
  KEY idx_ogloszenie_status (status)
);