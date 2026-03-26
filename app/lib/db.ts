import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function getCache<T>(url: string, type: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("url_cache")
    .select("result")
    .eq("url", url)
    .eq("type", type)
    .single();

  if (error || !data) {
    console.log(`[Cache] MISS: ${type} für ${url}`);
    return null;
  }

  console.log(`[Cache] HIT: ${type} für ${url}`);
  return data.result as T;
}

export async function setCache(url: string, type: string, result: unknown): Promise<void> {
  const { error } = await supabase
    .from("url_cache")
    .upsert(
      { url, type, result, created_at: new Date().toISOString() },
      { onConflict: "url,type" }
    );

  if (error) {
    console.error(`[Cache] SAVE ERROR: ${type} für ${url}`, error);
  } else {
    console.log(`[Cache] SAVED: ${type} für ${url}`);
  }
}
