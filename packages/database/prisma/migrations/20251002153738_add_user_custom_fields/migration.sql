-- CreateTable
CREATE TABLE "user_custom_fields" (
    "id" SERIAL NOT NULL,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "user_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_fields_field_key_key" ON "user_custom_fields"("field_key");
