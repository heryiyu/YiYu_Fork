
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUsers() {
    const userId = 'admin';
    const urlSuffix = (supabaseUrl || '').split('.').shift()?.slice(-4) || 'fixed';

    const possiblePasses = [
        `p@ss_${userId}_${urlSuffix}`.toLowerCase(),
        `p@ss_${userId}_fixed`.toLowerCase(),
        `p@ss_admin_bvft`,
        `p@ss_admin_fixed`
    ];

    for (const shadowPass of possiblePasses) {
        const shadowEmail = `${userId}@line.shadow`.toLowerCase();
        console.log(`Attempting login for ${shadowEmail} with pass: ${shadowPass}...`);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: shadowEmail,
            password: shadowPass
        });

        if (!authError) {
            console.log("Auth Success! User ID:", authData.user.id);
            break;
        } else {
            console.log(`Auth Failed for ${shadowPass}: ${authError.message}`);
        }
    }

    console.log("\nChecking users table by nickname or name (Case-Insensitive)...");
    const { data: nickData, error: nickError } = await supabase.from('users').select('*').or('nickname.ilike.%Admin%,name.ilike.%Admin%');
    if (nickError) {
        console.error("Error fetching users by nick:", nickError.message);
    } else {
        console.log("Found Users matching 'Admin' in nick/name:", JSON.stringify(nickData, null, 2));
    }

    // List any user IDs that HAVE sheep
    console.log("\nFinding unique user_ids that actually have sheep...");
    const { data: allUserIds } = await supabase.from('sheep').select('user_id');
    if (allUserIds) {
        const uniqueIds = [...new Set(allUserIds.map(s => s.user_id))];
        console.log("UUIDs in sheep table:", uniqueIds);

        if (uniqueIds.length > 0) {
            console.log("\nLooking up users for these UUIDs...");
            const { data: owners } = await supabase.from('users').select('*').in('id', uniqueIds);
            console.log("Owners of existing sheep:", JSON.stringify(owners, null, 2));
        }
    }
}

debugUsers();
