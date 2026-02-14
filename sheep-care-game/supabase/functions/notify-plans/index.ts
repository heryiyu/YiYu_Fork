// Setup:
// 1. supabase functions new notify-plans
// 2. Set Env: LINE_CHANNEL_ACCESS_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Init Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Calculate Time Range (Now ~ Now + 15 mins)
        const now = new Date()
        const future = new Date(now.getTime() + 15 * 60 * 1000)

        console.log(`[Notify] Checking schedules between ${now.toISOString()} and ${future.toISOString()}`)

        // 3. Query Schedules (Join users and participants)
        // We need line_id from users table to send the push
        const { data: schedules, error } = await supabaseClient
            .from('schedules')
            .select(`
                *,
                users:created_by (line_id),
                schedule_participants (
                    sheep (name)
                )
            `)
            .is('is_notified', false)
            .not('notify_at', 'is', null)
            .lte('notify_at', future.toISOString())
            .gt('notify_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString()) // Catch up 1h
            .order('notify_at')

        if (error) throw error

        console.log(`[Notify] Found ${schedules.length} schedules to notify`)

        if (!schedules || schedules.length === 0) {
            return new Response(JSON.stringify({ message: 'No schedules to notify' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const results = []
        const blessings = [
            "願神祝福你的牧養行程，加倍與你同在！💪",
            "神必紀念你的百上與辛勞，願祂的榮光照耀你！✨",
            "帶著平安與喜樂前行，主必引領你的每一步！🚶‍♂️",
            "願你的探訪充滿恩典，使人的心靈得著飽足！🙏",
            "你是神所喜悅的僕人，願祂賜你智慧與愛心！❤️",
            "在服事的路上，主的名必成為你的盾牌與力量！🛡️"
        ];

        const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')
        if (!LINE_ACCESS_TOKEN) {
            throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN Env Var")
        }

        // 4. Iterate and Send Push
        for (const schedule of schedules) {
            const lineId = schedule.users?.line_id;
            if (!lineId) {
                console.warn(`[Notify Schedule ${schedule.id}] No line_id found for creator ${schedule.created_by}`)
                continue;
            }

            // 4. Construct Message
            const timeString = new Date(schedule.scheduled_time).toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
                hour12: false, weekday: 'short'
            });

            // Handle multiple participants (sheep)
            const participantNames = schedule.schedule_participants
                ?.map((p: any) => p.sheep?.name)
                .filter(Boolean)
                .join('、') || '無指定夥伴';

            const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];

            const messageLines = [
                `🔔 牧養行程提醒`,
                `📝 行動：${schedule.action || '未命名行動'}`,
                `📅 時間：${timeString}`,
                `🐑 小羊：${participantNames}`
            ];

            if (schedule.location && schedule.location.trim()) {
                messageLines.push(`📍 地點：${schedule.location.trim()}`);
            }
            if (schedule.content && schedule.content.trim()) {
                messageLines.push(`📋 內容詳情：${schedule.content.trim()}`);
            }

            messageLines.push(``);
            messageLines.push(randomBlessing);

            const messageText = messageLines.join('\n');

            // Send to LINE
            const resp = await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    to: lineId,
                    messages: [{ type: 'text', text: messageText }]
                })
            })

            const resultText = await resp.text()
            const success = resp.ok
            console.log(`[Notify Schedule ${schedule.id}] Send result: ${success} - ${resultText}`)

            results.push({ id: schedule.id, success, apiRes: resultText })

            // 5. Update DB if success
            if (success) {
                await supabaseClient
                    .from('schedules')
                    .update({ is_notified: true })
                    .eq('id', schedule.id)
            }
        }

        // 6. Cleanup Old Schedules (> 90 days)
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        const { error: deleteError, count } = await supabaseClient
            .from('schedules')
            .delete({ count: 'exact' })
            .lt('scheduled_time', ninetyDaysAgo)

        if (deleteError) {
            console.error('[Cleanup] Failed to delete old schedules:', deleteError)
        } else {
            console.log(`[Cleanup] Deleted ${count} old schedules before ${ninetyDaysAgo}`)
        }

        return new Response(JSON.stringify({ processed: results, cleanupCount: count }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
