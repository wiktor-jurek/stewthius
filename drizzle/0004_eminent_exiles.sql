ALTER TABLE "ingredient_additions" ADD COLUMN "potency" integer;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "default_potency" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "ingredient_additions" ADD CONSTRAINT "potency_range" CHECK ("ingredient_additions"."potency" IS NULL OR ("ingredient_additions"."potency" >= 0 AND "ingredient_additions"."potency" <= 5));