import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Upload, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { uploadFile } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';

// Type pour les missions avec factures
interface DriverMission {
  id: string;
  mission_number: string;
  chauffeur_price_ht: number;
  chauffeur_invoice: string | null;
  chauffeur_paid: boolean;
  created_at: string;
  status: string;
}
interface DriverInvoicesProps {
  isAdmin?: boolean;
}
const DriverInvoices: React.FC<DriverInvoicesProps> = ({
  isAdmin = false
}) => {
  const {
    user,
    profile
  } = useAuth();
  const [missions, setMissions] = useState<DriverMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<DriverMission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [stats, setStats] = useState({
    totalMissions: 0,
    invoicedMissions: 0,
    uninvoicedMissions: 0,
    paidMissions: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    noInvoiceAmount: 0
  });

  // Charger les missions
  useEffect(() => {
    fetchMissions();
  }, [user, isAdmin]);

  // Calculer les statistiques
  useEffect(() => {
    calculateStats();
  }, [missions]);
  const fetchMissions = async () => {
    try {
      setLoading(true);
      let query = typedSupabase.from('missions').select('*');

      // Filtrer les missions par chauffeur si ce n'est pas un admin
      if (!isAdmin && user) {
        query = query.eq('chauffeur_id', user.id);
      }

      // Si admin, seulement celles qui ont un chauffeur assigné
      if (isAdmin) {
        query = query.not('chauffeur_id', 'is', null);
      }

      // Filtrer pour n'inclure que les missions terminées ou livrées
      query = query.in('status', ['termine', 'livre']);
      const {
        data,
        error
      } = await query.order('created_at', {
        ascending: false
      });
      if (error) throw error;
      const formattedMissions: DriverMission[] = data.map(mission => ({
        id: mission.id,
        mission_number: mission.mission_number || `#${mission.id.slice(0, 8)}`,
        chauffeur_price_ht: mission.chauffeur_price_ht || 0,
        chauffeur_invoice: mission.chauffeur_invoice,
        chauffeur_paid: mission.chauffeur_paid || false,
        created_at: mission.created_at,
        status: mission.status
      }));
      setMissions(formattedMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast.error("Impossible de charger les missions");
    } finally {
      setLoading(false);
    }
  };
  const calculateStats = () => {
    // Ne considérer que les missions dont le statut est 'termine' ou 'livre'
    const completedMissions = missions.filter(mission => mission.status === 'termine' || mission.status === 'livre');
    if (completedMissions.length === 0) {
      setStats({
        totalMissions: 0,
        invoicedMissions: 0,
        uninvoicedMissions: 0,
        paidMissions: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        noInvoiceAmount: 0
      });
      setTotalUnpaid(0);
      return;
    }
    const invoicedMissions = completedMissions.filter(mission => mission.chauffeur_invoice);
    const uninvoicedMissions = completedMissions.filter(mission => !mission.chauffeur_invoice);
    const paidMissions = completedMissions.filter(mission => mission.chauffeur_paid);
    const paidAmount = paidMissions.reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
    const unpaidAmount = invoicedMissions.filter(mission => !mission.chauffeur_paid).reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
    const noInvoiceAmount = uninvoicedMissions.reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
    setStats({
      totalMissions: completedMissions.length,
      invoicedMissions: invoicedMissions.length,
      uninvoicedMissions: uninvoicedMissions.length,
      paidMissions: paidMissions.length,
      paidAmount,
      unpaidAmount,
      noInvoiceAmount
    });

    // Pour l'admin, calculer le montant total à payer
    if (isAdmin) {
      const unpaidTotal = completedMissions.filter(mission => !mission.chauffeur_paid).reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
      setTotalUnpaid(unpaidTotal);
    }
  };
  const handleUploadClick = (mission: DriverMission) => {
    setSelectedMission(mission);
    setUploadDialogOpen(true);
  };
  const handleViewClick = async (mission: DriverMission) => {
    if (!mission.chauffeur_invoice) {
      toast.error("Aucune facture n'a été uploadée pour cette mission");
      return;
    }
    try {
      console.log('Trying to get public URL for:', mission.chauffeur_invoice);

      // Make sure we have a clean file path without leading slashes
      let filePath = mission.chauffeur_invoice;
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }

      // Create a direct URL to the document in the documents bucket
      const publicUrlRaw = `https://jaurkjcipcxkjimjlpiq.supabase.co/storage/v1/object/public/documents/${filePath}`;
      console.log('Using direct public URL:', publicUrlRaw);

      // Test if the URL is valid
      const testRequest = await fetch(publicUrlRaw, {
        method: 'HEAD'
      });
      if (!testRequest.ok) {
        throw new Error(`URL is not accessible: ${testRequest.status}`);
      }
      setViewUrl(publicUrlRaw);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error accessing invoice URL:', error);
      toast.error("Impossible d'accéder à la facture. Erreur: " + (error instanceof Error ? error.message : "Inconnue"));
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Vérifier que c'est un PDF
      if (file.type !== 'application/pdf') {
        toast.error("Seuls les fichiers PDF sont acceptés");
        return;
      }
      setSelectedFile(file);
    }
  };
  const handleUploadSubmit = async () => {
    if (!selectedFile || !selectedMission || !user) {
      toast.error("Fichier ou mission non sélectionnés");
      return;
    }
    try {
      setUploadLoading(true);

      // Générer un chemin unique pour la facture
      const fileName = `${Date.now()}_${selectedFile.name.replace(/[^\w\d.-]/g, '_')}`;
      const filePath = `driver_invoices/${selectedMission.id}/${fileName}`;
      console.log('Uploading file to path:', filePath);
      console.log('Using bucket:', 'documents');

      // Uploader le fichier - assurer que c'est bien dans le bucket 'documents'
      const uploadedPath = await uploadFile(filePath, selectedFile);
      if (!uploadedPath) {
        throw new Error("Échec de l'upload du fichier");
      }
      console.log('File uploaded successfully to path:', uploadedPath);

      // Mettre à jour la mission avec le chemin de la facture
      const {
        error
      } = await typedSupabase.from('missions').update({
        chauffeur_invoice: uploadedPath
      }).eq('id', selectedMission.id);
      if (error) throw error;
      toast.success("Facture uploadée avec succès");

      // Rafraîchir les données
      fetchMissions();
      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error("Impossible d'uploader la facture");
    } finally {
      setUploadLoading(false);
    }
  };
  const handleDeleteInvoice = async (mission: DriverMission) => {
    if (!mission.chauffeur_invoice) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      return;
    }
    try {
      // Supprimer le fichier du storage d'abord
      let filePath = mission.chauffeur_invoice;
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
      console.log('Attempting to delete file from storage:', filePath);
      const {
        error: storageError
      } = await supabase.storage.from('documents').remove([filePath]);
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // On continue même si la suppression du fichier échoue
        toast.error("Erreur lors de la suppression du fichier, mais la référence sera supprimée");
      } else {
        console.log('File deleted successfully from storage');
      }

      // Mettre à jour la mission pour supprimer la référence à la facture
      const {
        error
      } = await typedSupabase.from('missions').update({
        chauffeur_invoice: null,
        chauffeur_paid: false // Réinitialiser le statut de paiement
      }).eq('id', mission.id);
      if (error) throw error;
      toast.success("Facture supprimée avec succès");

      // Rafraîchir les données
      fetchMissions();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error("Impossible de supprimer la facture");
    }
  };
  const handleTogglePaidStatus = async (mission: DriverMission) => {
    if (!mission.chauffeur_invoice) {
      toast.error("Une facture doit d'abord être uploadée");
      return;
    }
    try {
      // Inverser le statut de paiement
      const newPaidStatus = !mission.chauffeur_paid;
      const {
        error
      } = await typedSupabase.from('missions').update({
        chauffeur_paid: newPaidStatus
      }).eq('id', mission.id);
      if (error) throw error;
      toast.success(newPaidStatus ? "Facture marquée comme payée" : "Facture marquée comme non payée");

      // Rafraîchir les données
      fetchMissions();
    } catch (error) {
      console.error('Error updating paid status:', error);
      toast.error("Impossible de mettre à jour le statut de paiement");
    }
  };
  const getInvoiceStatusBadge = (mission: DriverMission) => {
    if (!mission.chauffeur_invoice) {
      return <Badge variant="outline">Insérer une facture</Badge>;
    } else if (mission.chauffeur_paid) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Payé</Badge>;
    } else {
      return <Badge variant="secondary">En attente de paiement</Badge>;
    }
  };

  // Filtrer les missions par mois en cours
  const getCurrentMonthMissions = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return missions.filter(mission => {
      const missionDate = new Date(mission.created_at);
      return missionDate >= firstDayOfMonth && missionDate <= today;
    });
  };

  // Calculer les revenus du mois en cours (uniquement missions payées)
  const getCurrentMonthRevenue = () => {
    const currentMonthMissions = getCurrentMonthMissions();
    return currentMonthMissions.filter(mission => mission.chauffeur_paid).reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
  };
  return <div className="space-y-6 mx-[5px]">
      {isAdmin ? <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-left text-xl">Statistiques de facturation montant H.T. €</CardTitle>
            <CardDescription>Synthèse des paiements chauffeur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total restant à payer aux chauffeurs:</span>
                <span className="text-xl font-bold">{totalUnpaid.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              })}</span>
              </div>
            </div>
          </CardContent>
        </Card> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-[5px]">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
              <CardDescription>Factures payées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{getCurrentMonthRevenue().toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              })}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidMissions} facture(s) payée(s) ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <CardDescription>Factures non payées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-amber-500">{stats.unpaidAmount.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              })}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.invoicedMissions - stats.paidMissions} facture(s) en attente
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sans facture</CardTitle>
              <CardDescription>Missions sans facture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-500">{stats.noInvoiceAmount.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              })}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.uninvoicedMissions} mission(s) sans facture
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total missions</CardTitle>
              <CardDescription>Missions terminées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{stats.totalMissions}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalMissions} mission(s) terminée(s)
              </p>
            </CardContent>
          </Card>
        </div>}

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>{isAdmin ? "Factures des chauffeurs" : "Mes factures"}</CardTitle>
          <CardDescription>{isAdmin ? "Gestion des factures des chauffeurs" : "Gérer vos factures pour chaque mission"}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div> : missions.length === 0 ? <div className="text-center py-8 text-gray-500">
              Aucune mission trouvée
            </div> : <div className="space-y-4">
              {missions.map(mission => <div key={mission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">Mission {mission.mission_number}</p>
                        {getInvoiceStatusBadge(mission)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Montant: {mission.chauffeur_price_ht.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {/* Première ligne de boutons */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleUploadClick(mission)} disabled={!!mission.chauffeur_invoice}>
                          <Upload size={16} className="mr-1" />
                          Upload
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewClick(mission)} disabled={!mission.chauffeur_invoice}>
                          <Eye size={16} className="mr-1" />
                          Voir
                        </Button>
                        {isAdmin && <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(mission)} disabled={!mission.chauffeur_invoice} className="text-red-500 hover:bg-red-50">
                            <Trash2 size={16} className="mr-1" />
                            <span className="hidden sm:inline">Supprimer</span>
                            <span className="sm:hidden">supp.</span>
                          </Button>}
                      </div>
                      {/* Deuxième ligne pour le bouton de paiement sur mobile, inline sur desktop */}
                      {isAdmin && <Button variant={mission.chauffeur_paid ? "secondary" : "default"} size="sm" onClick={() => handleTogglePaidStatus(mission)} disabled={!mission.chauffeur_invoice} className="w-full sm:w-auto sm:hidden px-0 mx-[4px]">
                          <Check size={16} className="mr-1" />
                          {mission.chauffeur_paid ? "Annuler paiement" : "Marquer payé"}
                        </Button>}
                    </div>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Dialog pour l'upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploader une facture</DialogTitle>
            <DialogDescription>
              Pour la mission {selectedMission?.mission_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="invoice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Sélectionner un fichier PDF
              </label>
              <input id="invoice" type="file" accept="application/pdf" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium" onChange={handleFileChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploadLoading}>
              Annuler
            </Button>
            <Button onClick={handleUploadSubmit} disabled={!selectedFile || uploadLoading}>
              {uploadLoading ? 'Chargement...' : 'Uploader'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour visualiser la facture */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-[80vh]" aria-describedby="invoice-viewer-desc">
          <DialogHeader>
            <DialogTitle>Facture - Mission {selectedMission?.mission_number}</DialogTitle>
            <DialogDescription id="invoice-viewer-desc">
              Visualisation de la facture pour la mission {selectedMission?.mission_number}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full overflow-auto bg-white">
            {viewUrl ? <object data={viewUrl} type="application/pdf" className="w-full h-full" aria-label={`Facture pour la mission ${selectedMission?.mission_number}`}>
                <p className="text-center p-4">
                  Votre navigateur ne peut pas afficher le PDF. 
                  <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-2">
                    Cliquer ici pour télécharger
                  </a>
                </p>
              </object> : <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fermer
            </Button>
            {viewUrl && <Button onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}>
                Ouvrir dans un nouvel onglet
              </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default DriverInvoices;