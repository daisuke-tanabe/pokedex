CREATE INDEX "form_names_form_id_idx" ON "form_names" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_sprites_form_id_idx" ON "form_sprites" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_types_form_id_idx" ON "form_types" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_types_type_id_idx" ON "form_types" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "pokedex_entries_pokedex_id_idx" ON "pokedex_entries" USING btree ("pokedex_id");--> statement-breakpoint
CREATE INDEX "pokedex_entries_form_id_idx" ON "pokedex_entries" USING btree ("form_id");