
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://irahriqkrywijxngbvft.supabase.co";
const supabaseKey = "sb_publishable_cbGcHZ_5d6MDPVY_26XljA_RrvPUUhe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("--- Testing SheepDetailModal Query (Multi-Participant) ---");

    // 1. Get 2 Sheep
    const { data: sheeps } = await supabase.from('sheep').select('id, name').limit(2);
    if (!sheeps || sheeps.length < 2) {
        console.log("Not enough sheep to test.");
        return;
    }
    const [sheep1, sheep2] = sheeps;
    console.log(`Sheep 1: ${sheep1.name} (${sheep1.id})`);
    console.log(`Sheep 2: ${sheep2.name} (${sheep2.id})`);

    // 2. Create a specific test schedule
    const { data: schedule, error: createError } = await supabase
        .from('schedules')
        .insert([{
            created_by: 'b9cf6d23-f508-4d3e-af0c-34e10ec60ac1', // Use a valid UUID or existing one if possible
            action: 'Test Multi Join',
            scheduled_time: new Date().toISOString()
        }])
        .select()
        .single();

    if (createError) {
        console.error("Create Schedule Error:", createError);
        return;
    }
    console.log(`Created Test Schedule: ${schedule.id}`);

    // 3. Add both sheep to it
    await supabase.from('schedule_participants').insert([
        { schedule_id: schedule.id, sheep_id: sheep1.id },
        { schedule_id: schedule.id, sheep_id: sheep2.id }
    ]);
    console.log("Added participants.");

    // 4. Run the target query (simulating SheepDetailModal for Sheep 1)
    console.log("--- Executing Target Query ---");
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
        .eq('sheep_id', sheep1.id)
        .eq('schedule_id', schedule.id); // Narrow to this specific one

    if (error) {
        console.error("Query Error:", error);
    } else {
        const result = data[0];
        console.log("Query Results:");
        if (result && result.schedule && result.schedule.schedule_participants) {
            console.log(`Schedule ID: ${result.schedule.id}`);
            console.log(`Participants Count: ${result.schedule.schedule_participants.length}`);
            result.schedule.schedule_participants.forEach(p => {
                console.log(` - PID: ${p.sheep_id} ${p.sheep_id === sheep1.id ? '(Self)' : '(Other)'}`);
            });

            if (result.schedule.schedule_participants.length === 2) {
                console.log("✅ SUCCESS: Query returns ALL participants.");
            } else {
                console.log("❌ FAILURE: Query returns incomplete list.");
            }
        } else {
            console.log("❌ FAILURE: Structure missing.");
        }
    }

    // 5. Cleanup
    console.log("--- Cleanup ---");
    await supabase.from('schedule_participants').delete().eq('schedule_id', schedule.id);
    await supabase.from('schedules').delete().eq('id', schedule.id);
    console.log("Deleted test data.");
}

testQuery();
