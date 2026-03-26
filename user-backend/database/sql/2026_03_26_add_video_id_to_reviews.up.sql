-- Migracja ręczna (phpMyAdmin / mysql CLI) — odpowiednik Laravel:
-- database/migrations/2026_03_26_000009_add_video_id_to_reviews_table.php
--
-- Dodaje kolumnę video_id do tabeli reviews (nullable, max 32 znaki).
-- Uruchom raz na środowisku produkcyjnym po wdrożeniu kodu.
--
-- Jeśli kolumna `song_title` nie istnieje (bardzo stara baza), usuń fragment
-- "AFTER `song_title`" albo ustaw AFTER na istniejącą kolumnę przed video_id.

ALTER TABLE `reviews`
  ADD COLUMN `video_id` VARCHAR(32) NULL AFTER `song_title`;
