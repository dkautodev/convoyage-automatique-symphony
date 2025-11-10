import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliveryEmailRequest {
  clientEmail: string;
  missionNumber: string;
  clientDashboardUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      missionNumber,
      clientDashboardUrl
    }: DeliveryEmailRequest = await req.json();

    console.log("Sending delivery email:", { clientEmail, missionNumber });

    const emailContent = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #1e293b; 
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #ffffff;
            }
            .header { 
              background-color: #ffffff;
              padding: 30px 40px 20px;
              border-bottom: 3px solid #3b82f6;
            }
            .logo {
              max-width: 200px;
              height: auto;
            }
            .content { 
              padding: 40px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
            }
            .message {
              font-size: 15px;
              line-height: 1.8;
              color: #334155;
              margin: 20px 0;
            }
            .cta-button {
              display: inline-block;
              margin: 30px 0;
              padding: 16px 32px;
              background-color: #3b82f6;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              font-size: 17px;
              text-align: center;
            }
            .cta-button:hover {
              background-color: #2563eb;
            }
            .signature {
              margin-top: 30px;
              font-size: 15px;
              color: #334155;
            }
            .signature-company {
              font-weight: 600;
              color: #1e40af;
            }
            .footer { 
              background-color: #f1f5f9; 
              padding: 25px 40px; 
              text-align: center; 
              font-size: 13px; 
              color: #64748b;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://jaurkjcipcxkjimjlpiq.supabase.co/storage/v1/object/public/adminsettings/dk-automotive-logo.png" alt="DK Automotive" class="logo" />
            </div>
            <div class="content">
              <p class="greeting">Bonjour,</p>
              
              <p class="message">
                Le véhicule a été livré avec succès. Vous pouvez dès à présent consulter et télécharger la facture liée à la mission sur votre espace client.
              </p>

              <div style="text-align: center;">
                <a href="${clientDashboardUrl}" class="cta-button">
                  Accéder à votre espace client
                </a>
              </div>

              <p class="message">
                En vous remerciant pour votre confiance.
              </p>

              <p class="signature">
                Bien à vous,<br>
                <span class="signature-company">L'équipe DKAUTOMOTIVE</span>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">DK Automotive - Convoyage de véhicules</p>
            </div>
          </div>
        </body>
      </html>
    `;

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
          email: "noreply@dkautomotive.fr"
        },
        to: [{ email: clientEmail }],
        subject: `Livraison effectuée - Mission ${missionNumber}`,
        htmlContent: emailContent
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Brevo API error:", errorText);
      throw new Error(`Brevo API error: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Delivery email sent successfully via Brevo:", result);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.messageId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-delivery-email function:", error);
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
