-- CreateTable
CREATE TABLE "public"."EntityUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evento" (
    "id" TEXT NOT NULL,
    "tipoAccion" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "numeroTelefono" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntityUser_email_key" ON "public"."EntityUser"("email");
