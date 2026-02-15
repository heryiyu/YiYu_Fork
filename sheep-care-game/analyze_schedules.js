
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://irahriqkrywijxngbvft.supabase.co";
const supabaseKey = "sb_publishable_cbGcHZ_5d6MDPVY_26XljA_RrvPUUhe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSchedules() {
    console.log("--- Analyzing Schedules for Duplicates (Ignoring User ID) ---");

    const { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')
        .order('scheduled_time', { ascending: true });

    if (error) {
        console.error("Error fetching schedules:", error);
        return;
    }

    console.log(`Total schedules found: ${schedules.length}`);

    // Group by (action, scheduled_time)
    const groups = {};
    let duplicateCount = 0;
    let duplicateGroups = 0;

    for (const s of schedules) {
        const key = `${s.action}|${s.scheduled_time}`;

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(s);
    }

    for (const key in groups) {
        if (groups[key].length > 1) {
            duplicateGroups++;
            duplicateCount += groups[key].length - 1;
            console.log(`\nDuplicate Group Found (${groups[key].length} entries):`);
            console.log(`  Key: ${key}`);
            groups[key].forEach(s => {
                console.log(`    - ID: ${s.id}, By: ${s.created_by}, Created At: ${s.created_at}`);
            });
        }
    }

    console.log(`\nSummary:`);
    console.log(`  Total Groups: ${Object.keys(groups).length}`);
    console.log(`  Duplicate Groups: ${duplicateGroups}`);
    console.log(`  Redundant Schedules to Delete: ${duplicateCount}`);
}

analyzeSchedules();
