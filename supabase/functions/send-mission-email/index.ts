import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MissionEmailRequest {
  clientEmail: string;
  missionNumber: string;
  pickupCity: string;
  deliveryCity: string;
  vehicleCategory: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, missionNumber, pickupCity, deliveryCity, vehicleCategory }: MissionEmailRequest = await req.json();

    console.log("Sending mission email:", { clientEmail, missionNumber, pickupCity, deliveryCity });

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: "DK Automotive",
          email: "no-reply@dkautomotive.fr"
        },
        to: [
          {
            email: clientEmail
          }
        ],
        subject: `Demande de devis ${missionNumber}`,
        htmlContent: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 30px; }
                .footer { background-color: #e9e9e9; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                .info-box { background-color: white; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; }
                .info-label { font-weight: bold; color: #0066cc; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Demande de devis reçue</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p>Vous avez une nouvelle demande de mission en cours d'examination.</p>
                  
                  <div class="info-box">
                    <p><span class="info-label">Numéro de mission:</span> ${missionNumber}</p>
                    <p><span class="info-label">Ville de départ:</span> ${pickupCity}</p>
                    <p><span class="info-label">Ville d'arrivée:</span> ${deliveryCity}</p>
                    <p><span class="info-label">Type de véhicule:</span> ${vehicleCategory}</p>
                  </div>
                  
                  <p>Nous étudions votre demande et reviendrons vers vous dans les plus brefs délais.</p>
                  
                  <p>Cordialement,<br>L'équipe DK Automotive</p>
                </div>
                <div class="footer">
                  <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
              </div>
            </body>
          </html>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Brevo API error:", errorText);
      throw new Error(`Brevo API error: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully via Brevo:", result);

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-mission-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
