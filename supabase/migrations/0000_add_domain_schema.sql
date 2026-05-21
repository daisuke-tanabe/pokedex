CREATE TYPE "public"."form_category" AS ENUM('normal', 'regional', 'mega', 'mega-x', 'mega-y', 'gigantamax', 'tera', 'other');--> statement-breakpoint
CREATE TYPE "public"."sprite_gender" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."sprite_kind" AS ENUM('default', 'shiny', 'back', 'back_shiny');--> statement-breakpoint
CREATE TABLE "evolution_chains" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"locale" varchar(16) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "form_names_form_id_locale_unique" UNIQUE("form_id","locale")
);
--> statement-breakpoint
CREATE TABLE "form_sprites" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"gender" "sprite_gender" NOT NULL,
	"kind" "sprite_kind" NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "form_sprites_form_id_gender_kind_unique" UNIQUE("form_id","gender","kind")
);
--> statement-breakpoint
CREATE TABLE "form_types" (
	"form_id" integer NOT NULL,
	"slot" smallint NOT NULL,
	"type_id" integer NOT NULL,
	CONSTRAINT "form_types_pk" PRIMARY KEY("form_id","slot"),
	CONSTRAINT "form_types_form_id_type_id_unique" UNIQUE("form_id","type_id"),
	CONSTRAINT "form_types_slot_range" CHECK ("form_types"."slot" IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer NOT NULL,
	"slug" varchar(64) NOT NULL,
	"category" "form_category" NOT NULL,
	CONSTRAINT "forms_species_id_slug_unique" UNIQUE("species_id","slug")
);
--> statement-breakpoint
CREATE TABLE "locales" (
	"code" varchar(16) PRIMARY KEY NOT NULL,
	"name" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "pokedex_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokedex_id" integer NOT NULL,
	"species_id" integer NOT NULL,
	"pokedex_number" integer NOT NULL,
	"form_id" integer,
	CONSTRAINT "pokedex_entries_pokedex_id_pokedex_number_unique" UNIQUE("pokedex_id","pokedex_number"),
	CONSTRAINT "pokedex_entries_pokedex_id_species_id_unique" UNIQUE("pokedex_id","species_id")
);
--> statement-breakpoint
CREATE TABLE "pokedex_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokedex_id" integer NOT NULL,
	"locale" varchar(16) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "pokedex_names_pokedex_id_locale_unique" UNIQUE("pokedex_id","locale")
);
--> statement-breakpoint
CREATE TABLE "pokedexes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(32) NOT NULL,
	"region_id" integer,
	CONSTRAINT "pokedexes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "region_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"locale" varchar(16) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "region_names_region_id_locale_unique" UNIQUE("region_id","locale")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(32) NOT NULL,
	CONSTRAINT "regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"national_dex_number" integer NOT NULL,
	"evolution_chain_id" integer,
	CONSTRAINT "species_slug_unique" UNIQUE("slug"),
	CONSTRAINT "species_national_dex_number_unique" UNIQUE("national_dex_number")
);
--> statement-breakpoint
CREATE TABLE "species_evolutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_species_id" integer NOT NULL,
	"to_species_id" integer NOT NULL,
	CONSTRAINT "species_evolutions_from_to_unique" UNIQUE("from_species_id","to_species_id"),
	CONSTRAINT "species_evolutions_from_to_distinct" CHECK ("species_evolutions"."from_species_id" <> "species_evolutions"."to_species_id")
);
--> statement-breakpoint
CREATE TABLE "species_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer NOT NULL,
	"locale" varchar(16) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "species_names_species_id_locale_unique" UNIQUE("species_id","locale")
);
--> statement-breakpoint
CREATE TABLE "type_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"type_id" integer NOT NULL,
	"locale" varchar(16) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "type_names_type_id_locale_unique" UNIQUE("type_id","locale")
);
--> statement-breakpoint
CREATE TABLE "types" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(32) NOT NULL,
	CONSTRAINT "types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "form_names" ADD CONSTRAINT "form_names_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_names" ADD CONSTRAINT "form_names_locale_locales_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."locales"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_sprites" ADD CONSTRAINT "form_sprites_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_types" ADD CONSTRAINT "form_types_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_types" ADD CONSTRAINT "form_types_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokedex_entries" ADD CONSTRAINT "pokedex_entries_pokedex_id_pokedexes_id_fk" FOREIGN KEY ("pokedex_id") REFERENCES "public"."pokedexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokedex_entries" ADD CONSTRAINT "pokedex_entries_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokedex_entries" ADD CONSTRAINT "pokedex_entries_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokedex_names" ADD CONSTRAINT "pokedex_names_pokedex_id_pokedexes_id_fk" FOREIGN KEY ("pokedex_id") REFERENCES "public"."pokedexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokedex_names" ADD CONSTRAINT "pokedex_names_locale_locales_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."locales"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokedexes" ADD CONSTRAINT "pokedexes_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_names" ADD CONSTRAINT "region_names_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_names" ADD CONSTRAINT "region_names_locale_locales_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."locales"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species" ADD CONSTRAINT "species_evolution_chain_id_evolution_chains_id_fk" FOREIGN KEY ("evolution_chain_id") REFERENCES "public"."evolution_chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_evolutions" ADD CONSTRAINT "species_evolutions_from_species_id_species_id_fk" FOREIGN KEY ("from_species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_evolutions" ADD CONSTRAINT "species_evolutions_to_species_id_species_id_fk" FOREIGN KEY ("to_species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_names" ADD CONSTRAINT "species_names_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_names" ADD CONSTRAINT "species_names_locale_locales_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."locales"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "type_names" ADD CONSTRAINT "type_names_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "type_names" ADD CONSTRAINT "type_names_locale_locales_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."locales"("code") ON DELETE no action ON UPDATE no action;