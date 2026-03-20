import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envFile = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envFile, 'utf8')
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim()
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim()

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    const json = await res.json();
    console.log("Schemas:", Object.keys(json.definitions || json.components.schemas));
    if (json.definitions) {
         console.log("Profiles props:", json.definitions.profiles?.properties);
    }
}
run()
