-- =====================================================================
-- QuoteGen CRM — add company_details to "Lead Details"
-- Idempotent, additive only (live lead data preserved).
-- =====================================================================

alter table "Lead Details"
  add column if not exists company_details text;

comment on column "Lead Details".company_details is
  'Free-text notes about the company (size, industry, requirements, etc.).';
