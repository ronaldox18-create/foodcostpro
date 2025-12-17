-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the storage bucket
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
