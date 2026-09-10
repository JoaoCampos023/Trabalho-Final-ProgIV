-- Padronização de nomenclatura para português (campos técnicos)
-- Renomeia colunas em vez de recriá-las, para preservar os dados existentes.

-- Tabela "users"
ALTER TABLE "users" RENAME COLUMN "created_at" TO "criado_em";
ALTER TABLE "users" RENAME COLUMN "updated_at" TO "atualizado_em";
ALTER TABLE "users" RENAME COLUMN "password_hash" TO "senha_hash";

-- Tabela "animais"
ALTER TABLE "animais" RENAME COLUMN "created_at" TO "criado_em";
ALTER TABLE "animais" RENAME COLUMN "updated_at" TO "atualizado_em";

-- Tabela "producoes_leite"
ALTER TABLE "producoes_leite" RENAME COLUMN "created_at" TO "criado_em";
ALTER TABLE "producoes_leite" RENAME COLUMN "updated_at" TO "atualizado_em";

-- CreateEnum
-- Os valores existentes em "users"."role" já são exatamente "Admin" e "Cliente",
-- então a migração para enum é feita sem perda de dados.
CREATE TYPE "Role" AS ENUM ('Admin', 'Cliente');

-- AlterTable: converte a coluna "role" de VARCHAR livre para o enum "Role"
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Cliente';
