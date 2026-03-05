-- Migration for adding notification_phone to Clinics
ALTER TABLE "public"."Clinics" ADD COLUMN "notification_phone" text;
