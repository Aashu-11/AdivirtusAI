-- Create pathways table
CREATE TABLE IF NOT EXISTS pathways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    roadmap_id UUID NOT NULL,
    path JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_roadmap
        FOREIGN KEY(roadmap_id)
        REFERENCES personalized_learning_roadmap(id)
        ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_pathways_user_id ON pathways(user_id);

-- Create index on roadmap_id for faster queries
CREATE INDEX IF NOT EXISTS idx_pathways_roadmap_id ON pathways(roadmap_id);

-- Enable RLS
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own pathways
CREATE POLICY pathways_select_policy
    ON pathways
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy for users to insert their own pathways
CREATE POLICY pathways_insert_policy
    ON pathways
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own pathways
CREATE POLICY pathways_update_policy
    ON pathways
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy for users to delete their own pathways
CREATE POLICY pathways_delete_policy
    ON pathways
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON pathways TO authenticated;

-- Set up notifications for changes
CREATE OR REPLACE FUNCTION pathways_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pathways_updated_at
BEFORE UPDATE ON pathways
FOR EACH ROW
EXECUTE FUNCTION pathways_updated_at(); 