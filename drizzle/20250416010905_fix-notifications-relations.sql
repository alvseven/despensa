ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_products_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."products"("user_id") ON DELETE no action ON UPDATE no action;