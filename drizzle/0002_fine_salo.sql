ALTER TABLE "stew_analysis" DROP CONSTRAINT "rating_overall_range";--> statement-breakpoint
ALTER TABLE "stew_analysis" DROP CONSTRAINT "rating_richness_range";--> statement-breakpoint
ALTER TABLE "stew_analysis" DROP CONSTRAINT "rating_complexity_range";--> statement-breakpoint
ALTER TABLE "stew_analysis" DROP CONSTRAINT "texture_thickness_range";--> statement-breakpoint
ALTER TABLE "stew_analysis" DROP CONSTRAINT "appearance_clarity_range";--> statement-breakpoint
ALTER TABLE "stew_analysis" ADD CONSTRAINT "rating_overall_range" CHECK ("stew_analysis"."rating_overall" IS NULL OR ("stew_analysis"."rating_overall" >= 0 AND "stew_analysis"."rating_overall" <= 20));--> statement-breakpoint
ALTER TABLE "stew_analysis" ADD CONSTRAINT "rating_richness_range" CHECK ("stew_analysis"."rating_richness" IS NULL OR ("stew_analysis"."rating_richness" >= 0 AND "stew_analysis"."rating_richness" <= 20));--> statement-breakpoint
ALTER TABLE "stew_analysis" ADD CONSTRAINT "rating_complexity_range" CHECK ("stew_analysis"."rating_complexity" IS NULL OR ("stew_analysis"."rating_complexity" >= 0 AND "stew_analysis"."rating_complexity" <= 20));--> statement-breakpoint
ALTER TABLE "stew_analysis" ADD CONSTRAINT "texture_thickness_range" CHECK ("stew_analysis"."texture_thickness" IS NULL OR ("stew_analysis"."texture_thickness" >= 0 AND "stew_analysis"."texture_thickness" <= 20));--> statement-breakpoint
ALTER TABLE "stew_analysis" ADD CONSTRAINT "appearance_clarity_range" CHECK ("stew_analysis"."appearance_clarity" IS NULL OR ("stew_analysis"."appearance_clarity" >= 0 AND "stew_analysis"."appearance_clarity" <= 20));