
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://irahriqkrywijxngbvft.supabase.co";
const supabaseKey = "sb_publishable_cbGcHZ_5d6MDPVY_26XljA_RrvPUUhe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLinks() {
    console.log("--- Verifying Schedule <-> Participant Links ---");

    // 1. Fetch All Schedules
    const { data: schedules, error: sError } = await supabase
        .from('schedules')
        .select('id, action, scheduled_time, created_by');

    if (sError) { console.error("Error fetching schedules", sError); return; }

    // 2. Fetch All Participants
    const { data: participants, error: pError } = await supabase
        .from('schedule_participants')
        .select('id, schedule_id, sheep_id');

    if (pError) { console.error("Error fetching participants", pError); return; }

    console.log(`Schedules: ${schedules.length}`);
    console.log(`Participants: ${participants.length}`);

    // Check 1: Schedules with NO Participants
    const scheduleIdsWithParticipants = new Set(participants.map(p => p.schedule_id));
    const orphanedSchedules = schedules.filter(s => !scheduleIdsWithParticipants.has(s.id));

    if (orphanedSchedules.length > 0) {
        console.log(`\n[ALERT] Found ${orphanedSchedules.length} Schedules with NO Participants:`);
        orphanedSchedules.forEach(s => {
            console.log(`  - ID: ${s.id}`);
            console.log(`    Action: ${s.action}`);
            console.log(`    Time: ${s.scheduled_time}`);
            console.log(`    CreatedBy: ${s.created_by}`);
        });
    } else {
        console.log("\n[OK] All schedules have at least one participant.");
    }

    // Check 2: Participants with INVALID Schedule IDs
    // (Should be impossible with FK, but good to check if raw delete happened)
    const scheduleIds = new Set(schedules.map(s => s.id));
    const orphanedParticipants = participants.filter(p => !scheduleIds.has(p.schedule_id));

    if (orphanedParticipants.length > 0) {
        console.log(`\n[ALERT] Found ${orphanedParticipants.length} Participants linking to non-existent Schedules:`);
        orphanedParticipants.forEach(p => {
            console.log(`  - ID: ${p.id}, ScheduleID: ${p.schedule_id}`);
        });
    } else {
        console.log("\n[OK] All participants link to valid schedules.");
    }
}

verifyLinks();
