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

        // 2. Calculate Time Range (Now ~ Now + 10 mins)
        // We run this Cron every 10 mins.
        // To be safe, we look ahead 15 mins to avoid missing edge cases.
        const now = new Date()
        const future = new Date(now.getTime() + 15 * 60 * 1000)

        console.log(`[Notify] Checking plans between ${now.toISOString()} and ${future.toISOString()}`)

        // 3. Query Plans (Check notify_at)
        const { data: plans, error } = await supabaseClient
            .from('spiritual_plans')
            .select('*, sheep(name)')
            .is('is_notified', false)
            .not('notify_at', 'is', null) // Must have a notification time
            .lte('notify_at', future.toISOString()) // Trigger if notify_at is now or past
            .gt('notify_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString()) // Catch up 1h
            .order('notify_at')

        if (error) throw error

        console.log(`[Notify] Found ${plans.length} plans to notify`)

        if (!plans || plans.length === 0) {
            return new Response(JSON.stringify({ message: 'No plans to notify' }), {
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

        // 4. Iterate and Send Push
        const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')
        if (!LINE_ACCESS_TOKEN) {
            throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN Env Var")
        }

        for (const plan of plans) {
            // Construct Message
            const timeString = new Date(plan.scheduled_time).toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
                hour12: false, weekday: 'short'
            })

            const sheepName = plan.sheep?.name || '未知小羊';
            const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];

            const messageLines = [
                `🔔 靈程規劃提醒`,
                `🐑 小羊姓名：${sheepName}`,
                `📝 行動：${plan.action}`,
                `📅 時間：${timeString}`
            ];

            if (plan.location && plan.location.trim()) {
                messageLines.push(`📍 地點：${plan.location.trim()}`);
            }
            if (plan.content && plan.content.trim()) {
                messageLines.push(`📋 內容規劃：${plan.content.trim()}`);
            }

            messageLines.push(``);
            messageLines.push(randomBlessing);

            const messageText = messageLines.join('\n');

            const message = {
                type: 'text',
                text: messageText
            }

            // Send to LINE
            const resp = await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    to: plan.user_id,
                    messages: [message]
                })
            })

            const resultText = await resp.text()
            const success = resp.ok
            console.log(`[Notify Plan ${plan.id}] Send result: ${success} - ${resultText}`)

            results.push({ id: plan.id, success, apiRes: resultText })

            // 5. Update DB if success
            if (success) {
                await supabaseClient
                    .from('spiritual_plans')
                    .update({ is_notified: true })
                    .eq('id', plan.id)
            } else {
                console.error(`Failed to send LINE message for plan ${plan.id}`)
            }
        }

        return new Response(JSON.stringify({ processed: results }), {
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
