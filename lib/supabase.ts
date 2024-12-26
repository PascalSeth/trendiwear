
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient(`https://leafbfetdewlxeofugvl.supabase.co`, `${process.env.SUPABASE_ANON_KEY}`)