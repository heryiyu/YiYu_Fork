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
            .select('*')
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

        // 4. Iterate and Send Push
        const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')
        if (!LINE_ACCESS_TOKEN) {
            throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN Env Var")
        }

        for (const plan of plans) {
            // Construct Message
            const timeString = new Date(plan.scheduled_time).toLocaleTimeString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

            // Text different based on offset? 
            // Simple generic message is fine:
            const message = {
                type: 'text',
                text: `🔔 牧養提醒：${plan.action}\n📅 時間：${timeString}\n📍 地點：${plan.location || '無'}\n\n記得要準備喔！願神祝福你的擺上！💪`
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
                // Log failure but don't stop others
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
