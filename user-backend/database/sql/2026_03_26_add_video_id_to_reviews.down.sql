-- Cofnięcie migracji video_id (tylko gdy musisz przywrócić poprzedni stan schematu).
-- UWAGA: usunie kolumnę i wszystkie zapisane wartości video_id.

ALTER TABLE `reviews`
  DROP COLUMN `video_id`;
