-- Add affiliate_link and commission_rate columns to organizations table
-- These fields support affiliate/referral tracking for partner organizations

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS affiliate_link TEXT,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00; -- e.g., 15.00 for 15%

-- Add comment for documentation
COMMENT ON COLUMN organizations.affiliate_link IS 'Affiliate/referral tracking link for the organization';
COMMENT ON COLUMN organizations.commission_rate IS 'Commission rate percentage (e.g., 15.00 for 15%)';
