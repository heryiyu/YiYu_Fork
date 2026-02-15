
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://irahriqkrywijxngbvft.supabase.co";
const supabaseKey = "sb_publishable_cbGcHZ_5d6MDPVY_26XljA_RrvPUUhe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteOrphan() {
    const targetId = '4f038332-f23b-44e3-9105-e8ba26070a50';
    console.log(`--- Deleting Schedule ID: ${targetId} ---`);

    const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', targetId);

    if (error) {
        console.error("Error deleting schedule:", error);
    } else {
        console.log("Successfully deleted schedule.");
    }
}

deleteOrphan();
