
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://irahriqkrywijxngbvft.supabase.co";
const supabaseKey = "sb_publishable_cbGcHZ_5d6MDPVY_26XljA_RrvPUUhe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("--- Testing SheepDetailModal Query ---");

    // We need a valid sheep_id. Let's list some first.
    const { data: sheeps } = await supabase.from('sheep').select('id, name').limit(1);
    if (!sheeps || sheeps.length === 0) {
        console.log("No sheep found.");
        return;
    }

    const sheepId = sheeps[0].id;
    console.log(`Target Sheep: ${sheeps[0].name} (${sheepId})`);

    const { data, error } = await supabase
        .from('schedule_participants')
        .select(`
            *,
            schedule:schedule_id (
                *,
                schedule_participants (
                    *,
                    sheep_id
                )
            )
        `)
        .eq('sheep_id', sheepId);

    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log(`Found ${data.length} entries.`);
        if (data.length > 0) {
            const sample = data[0];
            console.log("Sample Data Entry:");
            // console.log(JSON.stringify(sample, null, 2)); 

            console.log("Sample Schedule:", sample.schedule ? "Found" : "Missing");
            if (sample.schedule) {
                console.log("Schedule Participants:", sample.schedule.schedule_participants ? `Found (${sample.schedule.schedule_participants.length})` : "Missing");
                if (sample.schedule.schedule_participants && sample.schedule.schedule_participants.length > 0) {
                    console.log("First Participant:", sample.schedule.schedule_participants[0]);
                }
            }
        }
    }
}

testQuery();
