-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create skills taxonomy table
CREATE TABLE skills_taxonomy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id VARCHAR(100) UNIQUE NOT NULL,
    canonical_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- technical_skills, soft_skills, domain_knowledge, standard_operating_procedures
    subcategory VARCHAR(100),
    description TEXT,
    competency_range_min INTEGER DEFAULT 1,
    competency_range_max INTEGER DEFAULT 100,
    aliases TEXT[] DEFAULT '{}', -- Array of alternative names
    keywords TEXT[] DEFAULT '{}', -- Related keywords for matching
    industry_tags TEXT[] DEFAULT '{}', -- Industries where this skill is common
    source_type VARCHAR(50) DEFAULT 'manual', -- manual, sop, domain_knowledge, job_description
    organization VARCHAR(200), -- Organization that contributed this skill
    usage_count INTEGER DEFAULT 0, -- How many times this skill has been used
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- Confidence in this skill mapping
    status VARCHAR(20) DEFAULT 'active', -- active, pending_review, deprecated
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP
);

-- Create skills embeddings table for vector search
CREATE TABLE skills_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id VARCHAR(100) REFERENCES skills_taxonomy(skill_id) ON DELETE CASCADE,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    text_content TEXT, -- The text used to generate embedding
    embedding_version VARCHAR(20) DEFAULT 'ada-002', -- Track embedding model version
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create pending skills table for review process
CREATE TABLE pending_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    suggested_competency_level INTEGER,
    source_type VARCHAR(50) NOT NULL, -- sop, domain_knowledge, job_description
    source_data JSONB, -- Original data that generated this skill
    organization VARCHAR(200),
    similarity_to_existing DECIMAL(3,2), -- Highest similarity score to existing skills
    similar_skills JSONB, -- Array of similar skills found
    confidence_score DECIMAL(3,2),
    auto_approved BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by UUID,
    review_notes TEXT
);

-- Create skill relationships table
CREATE TABLE skill_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_skill_id VARCHAR(100) REFERENCES skills_taxonomy(skill_id),
    child_skill_id VARCHAR(100) REFERENCES skills_taxonomy(skill_id),
    relationship_type VARCHAR(50), -- prerequisite, related, alternative, supersedes
    strength DECIMAL(3,2) DEFAULT 1.0, -- Relationship strength
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_skills_taxonomy_skill_id ON skills_taxonomy(skill_id);
CREATE INDEX idx_skills_taxonomy_category ON skills_taxonomy(category);
CREATE INDEX idx_skills_taxonomy_status ON skills_taxonomy(status);
CREATE INDEX idx_skills_taxonomy_organization ON skills_taxonomy(organization);
CREATE INDEX idx_skills_embeddings_skill_id ON skills_embeddings(skill_id);
CREATE INDEX ON skills_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_pending_skills_status ON pending_skills(status);
CREATE INDEX idx_pending_skills_organization ON pending_skills(organization);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skills_taxonomy_updated_at BEFORE UPDATE
    ON skills_taxonomy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_skills (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  skill_id text,
  canonical_name text,
  category text,
  subcategory text,
  description text,
  similarity float,
  usage_count int
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    st.skill_id,
    st.canonical_name,
    st.category,
    st.subcategory,
    st.description,
    1 - (se.embedding <=> query_embedding) AS similarity,
    st.usage_count
  FROM skills_embeddings se
  JOIN skills_taxonomy st ON se.skill_id = st.skill_id
  WHERE st.status = 'active'
    AND 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create function to find similar skills for new skill detection
CREATE OR REPLACE FUNCTION find_similar_skills_for_new (
  query_embedding vector(1536),
  skill_name text,
  category text DEFAULT NULL,
  similarity_threshold float DEFAULT 0.85
)
RETURNS TABLE (
  skill_id text,
  canonical_name text,
  category text,
  similarity float,
  should_merge boolean
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    st.skill_id,
    st.canonical_name,
    st.category,
    1 - (se.embedding <=> query_embedding) AS similarity,
    CASE 
      WHEN 1 - (se.embedding <=> query_embedding) > 0.95 THEN true
      WHEN 1 - (se.embedding <=> query_embedding) > 0.90 AND st.category = $3 THEN true
      ELSE false
    END as should_merge
  FROM skills_embeddings se
  JOIN skills_taxonomy st ON se.skill_id = st.skill_id
  WHERE st.status = 'active'
    AND 1 - (se.embedding <=> query_embedding) > similarity_threshold
    AND ($3 IS NULL OR st.category = $3)
  ORDER BY se.embedding <=> query_embedding
  LIMIT 10;
$$;

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_skill_usage(p_skill_id text)
RETURNS void
LANGUAGE SQL
AS $$
  UPDATE skills_taxonomy 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE skill_id = p_skill_id;
$$; 