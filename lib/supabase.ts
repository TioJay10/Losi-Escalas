"use client";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://owfbmhfrndbqqqayzfee.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable__tCbNCYNnnW3ZnohhubrXw_fC0M88kH";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key);
