import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MissionEmailRequest {
  clientEmail: string;
  missionNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupContactEmail: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryContactEmail: string;
  priceHT: number;
  priceTTC: number;
  vehicleCategory: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegistration: string;
  vehicleVin?: string;
  vehicleFuel: string;
  adminEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      missionNumber, 
      pickupAddress, 
      deliveryAddress,
      pickupContactName,
      pickupContactPhone,
      pickupContactEmail,
      deliveryContactName,
      deliveryContactPhone,
      deliveryContactEmail,
      priceHT,
      priceTTC,
      vehicleCategory,
      vehicleMake,
      vehicleModel,
      vehicleRegistration,
      vehicleVin,
      vehicleFuel,
      adminEmail = "contact@dkautomotive.fr"
    }: MissionEmailRequest = await req.json();

    console.log("Sending mission email:", { clientEmail, missionNumber, pickupAddress, deliveryAddress });

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
            .section {
              margin: 25px 0;
            }
            .section-title {
              font-weight: bold;
              color: #1e40af;
              font-size: 15px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-box { 
              background-color: #f1f5f9; 
              border-left: 4px solid #3b82f6; 
              padding: 20px; 
              margin: 15px 0;
              border-radius: 0 4px 4px 0;
            }
            .info-row {
              margin: 10px 0;
              display: flex;
              line-height: 1.8;
            }
            .info-label { 
              font-weight: 600; 
              color: #1e40af;
              min-width: 140px;
            }
            .info-value {
              color: #334155;
            }
            .price-box {
              background-color: #dbeafe;
              border-left: 4px solid #1e40af;
              padding: 20px;
              margin: 20px 0;
              border-radius: 0 4px 4px 0;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 15px;
            }
            .price-total {
              font-weight: bold;
              font-size: 17px;
              color: #1e40af;
              padding-top: 10px;
              border-top: 2px solid #3b82f6;
              margin-top: 10px;
            }
            .contact-info {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px 20px;
              margin: 25px 0;
              border-radius: 0 4px 4px 0;
            }
            .footer { 
              background-color: #f1f5f9; 
              padding: 25px 40px; 
              text-align: center; 
              font-size: 13px; 
              color: #64748b;
              border-top: 1px solid #e2e8f0;
            }
            .signature {
              margin-top: 30px;
              font-weight: 600;
              color: #1e40af;
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
              <p>Nous avons bien reçu votre demande de mission.</p>
              
              <div class="section">
                <div class="section-title">Informations de la mission</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Numéro :</span>
                    <span class="info-value">${missionNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Type de véhicule :</span>
                    <span class="info-value">${vehicleCategory}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Véhicule à convoyer</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Véhicule :</span>
                    <span class="info-value">${vehicleMake} ${vehicleModel}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Immatriculation :</span>
                    <span class="info-value">${vehicleRegistration}</span>
                  </div>
                  ${vehicleVin ? `<div class="info-row">
                    <span class="info-label">VIN :</span>
                    <span class="info-value">${vehicleVin}</span>
                  </div>` : ''}
                  <div class="info-row">
                    <span class="info-label">Carburant :</span>
                    <span class="info-value">${vehicleFuel}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Adresse de départ</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Adresse :</span>
                    <span class="info-value">${pickupAddress}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Contact :</span>
                    <span class="info-value">${pickupContactName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">${pickupContactPhone}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Email :</span>
                    <span class="info-value">${pickupContactEmail}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Adresse de livraison</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Adresse :</span>
                    <span class="info-value">${deliveryAddress}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Contact :</span>
                    <span class="info-value">${deliveryContactName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">${deliveryContactPhone}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Email :</span>
                    <span class="info-value">${deliveryContactEmail}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Tarification</div>
                <div class="price-box">
                  <div class="price-row">
                    <span>Prix HT :</span>
                    <span>${priceHT.toFixed(2)} €</span>
                  </div>
                  <div class="price-row price-total">
                    <span>Prix TTC :</span>
                    <span>${priceTTC.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div class="contact-info">
                <p style="margin: 0; font-size: 14px;">
                  Pour toute demande d'information complémentaire, vous avez la possibilité de nous contacter par mail à l'adresse 
                  <strong>contact@dkautomotive.fr</strong>
                </p>
              </div>

              <p class="signature">Bien à vous,<br>L'équipe DKAUTOMOTIVE</p>
            </div>
            <div class="footer">
              <p style="margin: 0;">DK Automotive - Convoyage de véhicules</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email au client
    const clientEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: "DK Automotive",
          email: "contact@dkautomotive.fr"
        },
        to: [{ email: clientEmail }],
        subject: `Demande de devis ${missionNumber} - ${vehicleMake} ${vehicleModel} - ${vehicleRegistration}`,
        htmlContent: emailContent
      })
    });

    if (!clientEmailResponse.ok) {
      const errorText = await clientEmailResponse.text();
      console.error("Brevo API error (client):", errorText);
      throw new Error(`Brevo API error (client): ${errorText}`);
    }

    // Envoyer l'email à l'admin
    const adminEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: "DK Automotive",
          email: "contact@dkautomotive.fr"
        },
        to: [{ email: adminEmail }],
        subject: `Demande de devis ${missionNumber} - ${vehicleMake} ${vehicleModel} - ${vehicleRegistration}`,
        htmlContent: emailContent
      })
    });

    if (!adminEmailResponse.ok) {
      const errorText = await adminEmailResponse.text();
      console.error("Brevo API error (admin):", errorText);
      throw new Error(`Brevo API error (admin): ${errorText}`);
    }

    const clientResult = await clientEmailResponse.json();
    const adminResult = await adminEmailResponse.json();
    console.log("Emails sent successfully via Brevo:", { client: clientResult, admin: adminResult });

    return new Response(JSON.stringify({ 
      success: true, 
      clientMessageId: clientResult.messageId,
      adminMessageId: adminResult.messageId 
    }), {
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
