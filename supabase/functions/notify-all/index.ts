import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { type, record } = await req.json()
    
    const appId = Deno.env.get("ONESIGNAL_APP_ID")!
    const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY")!

    let title = "Nouveauté sur KKCT 🔥"
    let message = "Nouvelle publication"

    if (type === 'document') {
      message = `Nouveau PDF: ${record.titre || record.nom || 'Document'}`
    } else if (type === 'td_session') {
      message = `Nouvelle séance TD: ${record.titre || record.matiere || 'TD programmé'}`
    }

    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Total Subscriptions"],
        headings: { fr: title, en: title },
        contents: { fr: message, en: message },
        web_url: "https://kkct.netlify.app/",
      })
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { status: 200 })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})