-- CreateTable
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "Street" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Street_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "streetId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floorsTotal" INTEGER NOT NULL,
    "entrancesCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- Backfill existing denormalized entrances into Street/Building.
-- Addresses are parsed as "street, d. number" when possible; otherwise the
-- whole address becomes the street name and house number falls back to "1".
INSERT INTO "Street" ("id", "name", "createdAt")
SELECT gen_random_uuid()::text,
       trim(split_part("address", ',', 1)),
       CURRENT_TIMESTAMP
FROM "Entrance"
GROUP BY trim(split_part("address", ',', 1));

INSERT INTO "Building" ("id", "streetId", "number", "floorsTotal", "entrancesCount", "createdAt")
SELECT gen_random_uuid()::text,
       s."id",
       COALESCE(NULLIF(trim(regexp_replace(split_part(e."address", ',', 2), '^(д\.|дом)?\s*', '', 'i')), ''), '1') AS "number",
       max(e."floorsTotal") AS "floorsTotal",
       count(e."id")::integer AS "entrancesCount",
       CURRENT_TIMESTAMP
FROM "Entrance" e
JOIN "Street" s ON s."name" = trim(split_part(e."address", ',', 1))
GROUP BY s."id", COALESCE(NULLIF(trim(regexp_replace(split_part(e."address", ',', 2), '^(д\.|дом)?\s*', '', 'i')), ''), '1');

-- Alter Entrance
ALTER TABLE "Entrance" ADD COLUMN "buildingId" TEXT;

UPDATE "Entrance" e
SET "buildingId" = b."id"
FROM "Street" s
JOIN "Building" b ON b."streetId" = s."id"
WHERE s."name" = trim(split_part(e."address", ',', 1))
  AND b."number" = COALESCE(NULLIF(trim(regexp_replace(split_part(e."address", ',', 2), '^(д\.|дом)?\s*', '', 'i')), ''), '1');

ALTER TABLE "Entrance" ALTER COLUMN "buildingId" SET NOT NULL;
ALTER TABLE "Entrance" DROP COLUMN "address";
ALTER TABLE "Entrance" DROP COLUMN "floorsTotal";

-- CreateIndex
CREATE UNIQUE INDEX "Street_name_city_key" ON "Street"("name", "city");
CREATE INDEX "Building_streetId_idx" ON "Building"("streetId");
CREATE UNIQUE INDEX "Building_streetId_number_key" ON "Building"("streetId", "number");
CREATE INDEX "Entrance_buildingId_idx" ON "Entrance"("buildingId");
CREATE UNIQUE INDEX "Entrance_buildingId_number_key" ON "Entrance"("buildingId", "number");

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "Street"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Entrance" ADD CONSTRAINT "Entrance_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
