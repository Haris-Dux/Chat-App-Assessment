ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap"
  EXCLUDE USING gist ("business_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&)
  WHERE ("status" = 'confirmed');
