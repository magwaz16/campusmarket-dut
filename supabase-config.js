const SUPABSE_URL ='https://mvbxcslristnrybhcyzy.supabase.co'
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Ynhjc2xyaXN0bnJ5YmhjeXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDE5NzEsImV4cCI6MjA4NTk3Nzk3MX0.ZWqUKdlPMyt_8-nq7qieBJgV0zllHn3XjD77dvPRIYQ'
const supabaseAdmin = supabase.createClient(SUPABSE_URL,SUPABASE_ANON_KEY, {
    global:{
        headers:{
            'x-admin-key': 'dut_super_admin_2026'
        }
    }
})

// ====== INITIALIZE SUPABASE CLIENT ========
const {createClient} = supabase
const supabaseClient  = createClient(SUPABSE_URL, SUPABASE_ANON_KEY)

// ==== MAKE IT AVAILABLE GLOBALLY ===========
window.supabaseClient = supabaseClient

console.log('✅ Supabase initialized!')