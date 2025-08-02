-- Add RLS policies for kv_store table
CREATE POLICY "Enable read access for authenticated users" ON public.kv_store_8f226d94
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.kv_store_8f226d94
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.kv_store_8f226d94
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.kv_store_8f226d94
    FOR DELETE USING (auth.role() = 'authenticated');