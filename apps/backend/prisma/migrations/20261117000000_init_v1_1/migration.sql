-- ============================================================
-- VITACARE INITIAL MIGRATION (VERSION 1.1)
-- Database Engine: PostgreSQL 16+
-- Based on: docs/DATABASE_SPECIFICATION.md v1.1
-- ============================================================

-- Bật extension mở rộng tìm kiếm chuỗi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------
-- 1. CREATE ENUMS
-- ------------------------------------------------------------

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

CREATE TYPE "SleepQuality" AS ENUM ('VERY_POOR', 'POOR', 'NORMAL', 'GOOD', 'EXCELLENT');

CREATE TYPE "ActivityType" AS ENUM ('WALKING', 'RUNNING', 'CYCLING', 'GYM', 'OTHER');

CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'HEALTHKIT', 'HEALTH_CONNECT');

CREATE TYPE "MedicationFrequency" AS ENUM ('DAILY', 'WEEKLY', 'INTERVAL', 'CUSTOM');

CREATE TYPE "MedicationLogStatus" AS ENUM ('PENDING', 'TAKEN', 'SKIPPED');

CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

CREATE TYPE "HealthRecordType" AS ENUM ('WEIGHT', 'HEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'OTHER');

CREATE TYPE "GoalType" AS ENUM ('WATER', 'SLEEP', 'STEPS', 'ACTIVITY_DURATION', 'CALORIES');

CREATE TYPE "NotificationType" AS ENUM ('WATER', 'SLEEP', 'MEDICATION', 'ACTIVITY');

-- ------------------------------------------------------------
-- 2. CREATE TABLES
-- ------------------------------------------------------------

-- 2.1 USERS
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 2.2 REFRESH_TOKENS
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "device_info" VARCHAR(255),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- 2.3 HEALTH_PROFILES
CREATE TABLE "health_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "gender" "Gender",
    "avatar_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("id")
);

-- 2.4 HEALTH_GOALS
CREATE TABLE "health_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "goal_type" "GoalType" NOT NULL,
    "target_value" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_goals_pkey" PRIMARY KEY ("id")
);

-- 2.5 WATER_LOGS
CREATE TABLE "water_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount_ml" INTEGER NOT NULL,
    "consumed_at" TIMESTAMPTZ NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- 2.6 SLEEP_LOGS
CREATE TABLE "sleep_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "sleep_start" TIMESTAMPTZ NOT NULL,
    "sleep_end" TIMESTAMPTZ NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "quality" "SleepQuality",
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleep_logs_pkey" PRIMARY KEY ("id")
);

-- 2.7 ACTIVITY_LOGS
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "steps" INTEGER,
    "duration_minutes" INTEGER,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "external_id" VARCHAR(255),
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- 2.8 MEDICATIONS
CREATE TABLE "medications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "dosage_label" VARCHAR(255),
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- 2.9 MEDICATION_SCHEDULES
CREATE TABLE "medication_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medication_id" UUID NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "reminder_time" TIME NOT NULL,
    "weekdays" INTEGER[],
    "interval_days" INTEGER,
    "start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "end_date" DATE,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_schedules_pkey" PRIMARY KEY ("id")
);

-- 2.10 MEDICATION_LOGS
CREATE TABLE "medication_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "taken_at" TIMESTAMPTZ,
    "status" "MedicationLogStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- 2.11 FOOD_ITEMS
CREATE TABLE "food_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID,
    "name" VARCHAR(255) NOT NULL,
    "calories_per_100g" DECIMAL(10,2),
    "protein_per_100g" DECIMAL(10,2),
    "carbs_per_100g" DECIMAL(10,2),
    "fat_per_100g" DECIMAL(10,2),
    "source" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- 2.12 MEAL_LOGS
CREATE TABLE "meal_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "consumed_at" TIMESTAMPTZ NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- 2.13 MEAL_ITEMS
CREATE TABLE "meal_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meal_log_id" UUID NOT NULL,
    "food_item_id" UUID,
    "food_name_snapshot" VARCHAR(255) NOT NULL,
    "quantity_g" DECIMAL(10,2) NOT NULL,
    "calories_snapshot" DECIMAL(10,2),
    "protein_snapshot" DECIMAL(10,2),
    "carbs_snapshot" DECIMAL(10,2),
    "fat_snapshot" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- 2.14 HEALTH_RECORDS
CREATE TABLE "health_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "record_type" "HealthRecordType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "secondary_value" DECIMAL(12,2),
    "unit" VARCHAR(30) NOT NULL,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- 2.15 HEALTH_ATTACHMENTS
CREATE TABLE "health_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "health_record_id" UUID NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_attachments_pkey" PRIMARY KEY ("id")
);

-- 2.16 NOTIFICATION_PREFERENCES
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder_times" TEXT[] NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- 3. CREATE FOREIGN KEY CONSTRAINTS
-- ------------------------------------------------------------

-- users relations
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "health_goals" ADD CONSTRAINT "health_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_items" ADD CONSTRAINT "food_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "health_records" ADD CONSTRAINT "health_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- medication child relations (RESTRICT to preserve history)
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "medication_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- nutrition child relations
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_log_id_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "food_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- health attachments relation
ALTER TABLE "health_attachments" ADD CONSTRAINT "health_attachments_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- 4. CREATE INDEXES
-- ------------------------------------------------------------

-- users & tokens
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_is_active_idx" ON "users"("is_active");
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at") WHERE "deleted_at" IS NOT NULL;

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- health_profiles
CREATE UNIQUE INDEX "health_profiles_user_id_key" ON "health_profiles"("user_id");

-- health_goals
CREATE INDEX "health_goals_user_id_goal_type_start_date_idx" ON "health_goals"("user_id", "goal_type", "start_date" DESC);
CREATE INDEX "health_goals_user_id_is_active_idx" ON "health_goals"("user_id", "is_active");
CREATE UNIQUE INDEX "health_goals_user_type_active_uniq" ON "health_goals"("user_id", "goal_type") WHERE "is_active" = TRUE;

-- water_logs
CREATE INDEX "water_logs_user_id_consumed_at_idx" ON "water_logs"("user_id", "consumed_at" DESC);

-- sleep_logs
CREATE INDEX "sleep_logs_user_id_sleep_start_idx" ON "sleep_logs"("user_id", "sleep_start" DESC);

-- activity_logs
CREATE INDEX "activity_logs_user_id_recorded_at_idx" ON "activity_logs"("user_id", "recorded_at" DESC);
CREATE INDEX "activity_logs_user_id_source_external_id_idx" ON "activity_logs"("user_id", "source", "external_id");
CREATE UNIQUE INDEX "activity_logs_user_source_ext_uniq" ON "activity_logs"("user_id", "source", "external_id") WHERE "external_id" IS NOT NULL;

-- medications
CREATE INDEX "medications_user_id_is_active_idx" ON "medications"("user_id", "is_active");

-- medication_schedules
CREATE INDEX "medication_schedules_medication_id_is_enabled_idx" ON "medication_schedules"("medication_id", "is_enabled");

-- medication_logs
CREATE UNIQUE INDEX "medication_logs_schedule_id_scheduled_at_key" ON "medication_logs"("schedule_id", "scheduled_at");
CREATE INDEX "medication_logs_schedule_id_idx" ON "medication_logs"("schedule_id");

-- food_items
CREATE INDEX "food_items_created_by_idx" ON "food_items"("created_by");
CREATE INDEX "food_items_name_idx" ON "food_items"("name");
CREATE INDEX "food_items_name_trgm_idx" ON "food_items" USING gin ("name" gin_trgm_ops);

-- meal_logs
CREATE INDEX "meal_logs_user_id_consumed_at_idx" ON "meal_logs"("user_id", "consumed_at" DESC);

-- meal_items
CREATE INDEX "meal_items_meal_log_id_idx" ON "meal_items"("meal_log_id");
CREATE INDEX "meal_items_food_item_id_idx" ON "meal_items"("food_item_id");

-- health_records
CREATE INDEX "health_records_user_id_record_type_recorded_at_idx" ON "health_records"("user_id", "record_type", "recorded_at" DESC);

-- health_attachments
CREATE INDEX "health_attachments_health_record_id_idx" ON "health_attachments"("health_record_id");

-- notification_preferences
CREATE UNIQUE INDEX "notification_preferences_user_id_notification_type_key" ON "notification_preferences"("user_id", "notification_type");

-- ------------------------------------------------------------
-- 5. CREATE CHECK CONSTRAINTS (DATA INTEGRITY & BUSINESS RULES)
-- ------------------------------------------------------------

-- BR-WATER-01
ALTER TABLE "water_logs" ADD CONSTRAINT "chk_water_amount_positive" CHECK ("amount_ml" > 0);

-- BR-SLEEP-01, BR-SLEEP-05
ALTER TABLE "sleep_logs" 
    ADD CONSTRAINT "chk_sleep_time_logic" CHECK ("sleep_end" > "sleep_start"),
    ADD CONSTRAINT "chk_sleep_duration_positive" CHECK ("duration_minutes" > 0);

-- BR-ACT-02, BR-ACT-03
ALTER TABLE "activity_logs" 
    ADD CONSTRAINT "chk_activity_steps_positive" CHECK ("steps" IS NULL OR "steps" >= 0),
    ADD CONSTRAINT "chk_activity_duration_positive" CHECK ("duration_minutes" IS NULL OR "duration_minutes" > 0);

-- Profile height & weight
ALTER TABLE "health_profiles" 
    ADD CONSTRAINT "chk_profile_height_positive" CHECK ("height_cm" IS NULL OR "height_cm" > 0),
    ADD CONSTRAINT "chk_profile_weight_positive" CHECK ("weight_kg" IS NULL OR "weight_kg" > 0);

-- Goals target value and date
ALTER TABLE "health_goals" 
    ADD CONSTRAINT "chk_goal_target_positive" CHECK ("target_value" > 0),
    ADD CONSTRAINT "chk_goal_date_logic" CHECK ("end_date" IS NULL OR "end_date" >= "start_date");

-- BR-NUT-03
ALTER TABLE "meal_items" 
    ADD CONSTRAINT "chk_meal_quantity_positive" CHECK ("quantity_g" > 0),
    ADD CONSTRAINT "chk_meal_calories_positive" CHECK ("calories_snapshot" IS NULL OR "calories_snapshot" >= 0);

-- Food items macros >= 0
ALTER TABLE "food_items" 
    ADD CONSTRAINT "chk_food_calories_positive" CHECK ("calories_per_100g" IS NULL OR "calories_per_100g" >= 0),
    ADD CONSTRAINT "chk_food_protein_positive" CHECK ("protein_per_100g" IS NULL OR "protein_per_100g" >= 0),
    ADD CONSTRAINT "chk_food_carbs_positive" CHECK ("carbs_per_100g" IS NULL OR "carbs_per_100g" >= 0),
    ADD CONSTRAINT "chk_food_fat_positive" CHECK ("fat_per_100g" IS NULL OR "fat_per_100g" >= 0);

-- BR-MED-03
ALTER TABLE "medication_schedules" 
    ADD CONSTRAINT "chk_schedule_date_logic" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
    ADD CONSTRAINT "chk_schedule_interval_positive" CHECK ("interval_days" IS NULL OR "interval_days" > 0);

-- BR-MED-06, BR-MED-07
ALTER TABLE "medication_logs" 
    ADD CONSTRAINT "chk_medication_log_taken_time" CHECK (("status" = 'TAKEN' AND "taken_at" IS NOT NULL) OR ("status" != 'TAKEN'));

-- Health records
ALTER TABLE "health_records" 
    ADD CONSTRAINT "chk_health_record_value_positive" CHECK ("value" > 0),
    ADD CONSTRAINT "chk_health_record_bp_logic" CHECK ("record_type" != 'BLOOD_PRESSURE' OR ("secondary_value" IS NOT NULL AND "secondary_value" > 0));

