
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://irahriqkrywijxngbvft.supabase.co";
const supabaseKey = "sb_publishable_cbGcHZ_5d6MDPVY_26XljA_RrvPUUhe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeParticipants() {
    console.log("--- Analyzing Schedule Participants ---");

    const { data: participants, error } = await supabase
        .from('schedule_participants')
        .select('*');

    if (error) {
        console.error("Error fetching participants:", error);
        return;
    }

    console.log(`Total participants found: ${participants.length}`);

    // Group by (schedule_id, sheep_id)
    const groups = {};
    let duplicateCount = 0;

    for (const p of participants) {
        const key = `${p.schedule_id}|${p.sheep_id}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(p);
    }

    for (const key in groups) {
        if (groups[key].length > 1) {
            duplicateCount += groups[key].length - 1;
            console.log(`\nDuplicate Participant Entry (${groups[key].length} entries):`);
            console.log(`  Key: ${key}`);
            groups[key].forEach(p => {
                console.log(`    - ID: ${p.id}, Schedule: ${p.schedule_id}, Sheep: ${p.sheep_id}`);
            });
        }
    }

    console.log(`\nSummary:`);
    console.log(`  Total Groups: ${Object.keys(groups).length}`);
    console.log(`  Duplicate Entries: ${duplicateCount}`);
}

analyzeParticipants();
