CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text DEFAULT 'other' CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'friend', 'trust', 'charity', 'other')),
  allocation_percentage numeric DEFAULT 0 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  date_of_birth date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beneficiaries"
  ON beneficiaries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own beneficiaries"
  ON beneficiaries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own beneficiaries"
  ON beneficiaries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own beneficiaries"
  ON beneficiaries FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_name text NOT NULL,
  policy_type text DEFAULT 'other' CHECK (policy_type IN ('life', 'health', 'disability', 'long_term_care', 'property', 'auto', 'umbrella', 'other')),
  policy_number text DEFAULT '',
  provider text DEFAULT '',
  coverage_amount numeric DEFAULT 0 CHECK (coverage_amount >= 0),
  premium_amount numeric DEFAULT 0 CHECK (premium_amount >= 0),
  premium_frequency text DEFAULT 'monthly' CHECK (premium_frequency IN ('monthly', 'quarterly', 'annual')),
  start_date date,
  expiry_date date,
  beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance policies"
  ON insurance_policies FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own insurance policies"
  ON insurance_policies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own insurance policies"
  ON insurance_policies FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own insurance policies"
  ON insurance_policies FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS estate_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text DEFAULT 'other' CHECK (document_type IN ('will', 'trust', 'power_of_attorney', 'healthcare_directive', 'beneficiary_designation', 'other')),
  last_updated date,
  attorney_name text DEFAULT '',
  attorney_contact text DEFAULT '',
  location text DEFAULT '',
  review_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE estate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estate documents"
  ON estate_documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own estate documents"
  ON estate_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own estate documents"
  ON estate_documents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own estate documents"
  ON estate_documents FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_beneficiary ON insurance_policies(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_estate_documents_user_id ON estate_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_estate_documents_review_date ON estate_documents(review_date) WHERE review_date IS NOT NULL;
