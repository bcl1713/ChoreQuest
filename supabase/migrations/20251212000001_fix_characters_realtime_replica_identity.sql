-- Fix characters table realtime configuration
-- Adds REPLICA IDENTITY FULL for proper DELETE event handling

ALTER TABLE characters REPLICA IDENTITY FULL;
