-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('FULL_LEAVE', 'WORK_FROM_HOME', 'SICK_LEAVE', 'CASUAL_LEAVE', 'EMERGENCY_LEAVE');

-- CreateEnum
CREATE TYPE "public"."LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE_APPROVED', 'WFH_APPROVED', 'LATE', 'HALF_DAY');

-- CreateEnum
CREATE TYPE "public"."AttendanceException" AS ENUM ('WORKED_ON_APPROVED_LEAVE', 'NO_WORK_ON_WFH', 'ABSENT_DESPITE_DENIAL', 'WORKED_DESPITE_DENIAL', 'ATTENDANCE_WORK_MISMATCH', 'MISSING_CHECKOUT', 'WORK_WITHOUT_CHECKIN');

-- CreateEnum
CREATE TYPE "public"."WarningType" AS ENUM ('ATTENDANCE', 'LEAVE_MISUSE', 'BREAK_EXCEEDED', 'WORK_QUALITY', 'BEHAVIORAL', 'SYSTEM_MISUSE');

-- CreateEnum
CREATE TYPE "public"."WarningSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."PenaltyType" AS ENUM ('ATTENDANCE_DEDUCTION', 'LATE_PENALTY', 'UNAUTHORIZED_ABSENCE', 'POLICY_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('LEAVE_REQUEST_UPDATE', 'WARNING_ISSUED', 'PENALTY_ISSUED', 'ATTENDANCE_ALERT', 'SYSTEM_NOTIFICATION', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ImportType" AS ENUM ('ATTENDANCE_CSV', 'FLOWACE_CSV', 'EMPLOYEE_CSV');

-- CreateEnum
CREATE TYPE "public"."ImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."AttendanceSource" AS ENUM ('SRP_FILE', 'MANUAL_ENTRY', 'BIOMETRIC_IMPORT', 'CSV_IMPORT');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "designation" TEXT,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" SERIAL NOT NULL,
    "tag_name" TEXT NOT NULL,
    "time_minutes" INTEGER NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignments" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."logs" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "log_date" DATE NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_manual" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "lunchOutTime" TIMESTAMP(3),
    "lunchInTime" TIMESTAMP(3),
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shift" TEXT,
    "shiftStart" TEXT,
    "remarks" TEXT,
    "source" "public"."AttendanceSource" NOT NULL DEFAULT 'MANUAL_ENTRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leave_requests" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "leave_type" "public"."LeaveType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "status" "public"."LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" INTEGER,
    "admin_comments" TEXT,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "total_hours" DOUBLE PRECISION,
    "leave_request_id" INTEGER,
    "has_tag_work" BOOLEAN NOT NULL DEFAULT false,
    "has_flowace_work" BOOLEAN NOT NULL DEFAULT false,
    "tag_work_minutes" INTEGER NOT NULL DEFAULT 0,
    "flowace_minutes" INTEGER NOT NULL DEFAULT 0,
    "has_exception" BOOLEAN NOT NULL DEFAULT false,
    "exception_type" "public"."AttendanceException",
    "exception_notes" TEXT,
    "import_source" TEXT NOT NULL DEFAULT 'manual',
    "import_batch" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flowace_records" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "active_minutes" INTEGER NOT NULL DEFAULT 0,
    "idle_minutes" INTEGER NOT NULL DEFAULT 0,
    "applications" JSONB,
    "websites" JSONB,
    "screenshots" INTEGER NOT NULL DEFAULT 0,
    "keystrokes" INTEGER NOT NULL DEFAULT 0,
    "mouseClicks" INTEGER NOT NULL DEFAULT 0,
    "import_batch" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flowace_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warnings" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "warning_type" "public"."WarningType" NOT NULL,
    "warning_date" DATE NOT NULL,
    "warning_message" TEXT NOT NULL,
    "severity" "public"."WarningSeverity" NOT NULL DEFAULT 'LOW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "issued_by" INTEGER,
    "related_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."penalties" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "attendance_id" INTEGER,
    "penalty_type" "public"."PenaltyType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "penalty_date" DATE NOT NULL,
    "issued_by" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "related_id" INTEGER,
    "related_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_logs" (
    "id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" "public"."ImportType" NOT NULL,
    "status" "public"."ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "processed_records" INTEGER NOT NULL DEFAULT 0,
    "error_records" INTEGER NOT NULL DEFAULT 0,
    "batch_id" TEXT NOT NULL,
    "uploaded_by" INTEGER,
    "errors" JSONB,
    "summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_history" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "errorRecords" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "batchId" TEXT NOT NULL,
    "errors" JSONB,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."breaks" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "break_date" DATE NOT NULL,
    "break_in_time" TIMESTAMP(3),
    "break_out_time" TIMESTAMP(3),
    "break_duration" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "warning_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issues" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "issue_category" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "issue_status" TEXT NOT NULL DEFAULT 'pending',
    "raised_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_date" TIMESTAMP(3),
    "admin_response" TEXT,
    "days_elapsed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."submission_status" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "submission_date" TIMESTAMP(3) NOT NULL,
    "submission_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_locked" BOOLEAN NOT NULL DEFAULT true,
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "status_message" TEXT NOT NULL DEFAULT 'Data submitted successfully',

    CONSTRAINT "submission_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "public"."employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_employee_id_tag_id_key" ON "public"."assignments"("employee_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "logs_employee_id_tag_id_log_date_key" ON "public"."logs"("employee_id", "tag_id", "log_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_employeeId_attendanceDate_key" ON "public"."attendance"("employeeId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employee_id_date_key" ON "public"."attendance_records"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "flowace_records_employee_id_date_start_time_key" ON "public"."flowace_records"("employee_id", "date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "upload_history_batchId_key" ON "public"."upload_history"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_status_employee_id_submission_date_key" ON "public"."submission_status"("employee_id", "submission_date");

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs" ADD CONSTRAINT "logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs" ADD CONSTRAINT "logs_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "public"."leave_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flowace_records" ADD CONSTRAINT "flowace_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warnings" ADD CONSTRAINT "warnings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."breaks" ADD CONSTRAINT "breaks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submission_status" ADD CONSTRAINT "submission_status_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
