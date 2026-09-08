-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "role" VARCHAR(20) NOT NULL DEFAULT 'Cliente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "brinco" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "sexo" CHAR(1) NOT NULL,
    "raca" VARCHAR(50),
    "peso" DECIMAL(10,2),
    "data_nascimento" DATE NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "brinco_pai" INTEGER,
    "brinco_mae" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("brinco")
);

-- CreateTable
CREATE TABLE "producoes_leite" (
    "id" SERIAL NOT NULL,
    "animal_brinco" INTEGER NOT NULL,
    "data_coleta" DATE NOT NULL,
    "litros" DECIMAL(10,2) NOT NULL,
    "periodo" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producoes_leite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_brinco_pai_fkey" FOREIGN KEY ("brinco_pai") REFERENCES "animais"("brinco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_brinco_mae_fkey" FOREIGN KEY ("brinco_mae") REFERENCES "animais"("brinco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producoes_leite" ADD CONSTRAINT "producoes_leite_animal_brinco_fkey" FOREIGN KEY ("animal_brinco") REFERENCES "animais"("brinco") ON DELETE CASCADE ON UPDATE CASCADE;
