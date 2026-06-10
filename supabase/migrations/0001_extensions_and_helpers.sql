-- 0001_extensions_and_helpers.sql
-- Extensões e funções utilitárias compartilhadas pelas próximas migrations.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
