import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mgjxvodyhlrgqpkujzlq.supabase.co';

const SUPABASE_KEY = 'sb_publishable_vS26lkhaeT_lJ4ft7YX-UQ_5_8T7Bit';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);