USE PokeMonster;

INSERT INTO rola (nazwa) VALUES
('USER'),
('ADMIN');

INSERT INTO uzytkownicy (imie, nazwisko, email, haslo, rola_id) VALUES
('Jan', 'Kowalski', 'jan@example.com', 'haslo123', 1),
('Ala', 'Nowak', 'ala@example.com', 'haslo123', 1),
('Admin', 'Root', 'admin@example.com', 'admin123', 2);

INSERT INTO karty (nazwa_kart, numer_kart) VALUES
('Pikachu', 25),
('Charizard', 6),
('Bulbasaur', 1),
('Squirtle', 7);

INSERT INTO karty_w_danej_kolekcji (uzytkownicy_id, karty_id, ocena_karty, wyslana_do_oceny, odeslana_z_oceny, cena) VALUES
(1, 1, 8, '2025-01-10', '2025-01-20', 49.99),   
(1, 2, 9, NULL, NULL, 399.00),                  
(2, 3, 7, NULL, NULL, 19.99),                   
(2, 1, 6, NULL, NULL, 29.99);                   

INSERT INTO ogloszenie
(typ, cena, status, karty_w_danej_kolekcji_id) VALUES
('SPRZEDAZ', 55.00, 'AKTYWNE', 1),
('SPRZEDAZ', 420.00, 'AKTYWNE', 2),
('WYMIANA', NULL, 'AKTYWNE', 3),
('SPRZEDAZ', 30.00, 'ZAMKNIETE', 4);