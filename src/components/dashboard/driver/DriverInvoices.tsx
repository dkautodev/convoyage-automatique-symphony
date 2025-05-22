
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Upload, Trash2, Check, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { uploadFile, getPublicUrl } from '@/integrations/supabase/storage';
import { cn } from '@/lib/utils';

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
  const { user, profile } = useAuth();
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
    noInvoiceAmount: 0,
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

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedMissions: DriverMission[] = data.map(mission => ({
        id: mission.id,
        mission_number: mission.mission_number || `#${mission.id.slice(0, 8)}`,
        chauffeur_price_ht: mission.chauffeur_price_ht || 0,
        chauffeur_invoice: mission.chauffeur_invoice,
        chauffeur_paid: mission.chauffeur_paid || false,
        created_at: mission.created_at,
        status: mission.status,
      }));
      
      setMissions(formattedMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Ne considérer que les missions dont le statut est 'termine' ou 'livre'
    const completedMissions = missions.filter(mission => 
      mission.status === 'termine' || mission.status === 'livre'
    );

    if (completedMissions.length === 0) {
      setStats({
        totalMissions: 0,
        invoicedMissions: 0,
        uninvoicedMissions: 0,
        paidMissions: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        noInvoiceAmount: 0,
      });
      setTotalUnpaid(0);
      return;
    }

    const invoicedMissions = completedMissions.filter(mission => mission.chauffeur_invoice);
    const uninvoicedMissions = completedMissions.filter(mission => !mission.chauffeur_invoice);
    const paidMissions = completedMissions.filter(mission => mission.chauffeur_paid);

    const paidAmount = paidMissions.reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
    const unpaidAmount = invoicedMissions.filter(mission => !mission.chauffeur_paid)
      .reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
    const noInvoiceAmount = uninvoicedMissions.reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);

    setStats({
      totalMissions: completedMissions.length,
      invoicedMissions: invoicedMissions.length,
      uninvoicedMissions: uninvoicedMissions.length,
      paidMissions: paidMissions.length,
      paidAmount,
      unpaidAmount,
      noInvoiceAmount,
    });

    // Pour l'admin, calculer le montant total à payer
    if (isAdmin) {
      const unpaidTotal = completedMissions
        .filter(mission => !mission.chauffeur_paid)
        .reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
      setTotalUnpaid(unpaidTotal);
    }
  };

  const handleUploadClick = (mission: DriverMission) => {
    setSelectedMission(mission);
    setUploadDialogOpen(true);
  };

  const handleViewClick = async (mission: DriverMission) => {
    if (!mission.chauffeur_invoice) {
      toast({
        title: "Information",
        description: "Aucune facture n'a été uploadée pour cette mission"
      });
      return;
    }
    try {
      const publicUrl = getPublicUrl(mission.chauffeur_invoice);
      if (publicUrl) {
        console.log("Opening document with URL:", publicUrl);
        setViewUrl(publicUrl);
        setSelectedMission(mission);
        setViewDialogOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer l'URL de la facture",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting invoice URL:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la facture",
        variant: "destructive"
      });
    }
  };

  const handleOpenInNewTab = (url: string) => {
    // Add timestamp to URL to prevent caching
    const urlWithTimestamp = `${url}?t=${new Date().getTime()}`;
    window.open(urlWithTimestamp, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Vérifier que c'est un PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Format invalide",
          description: "Seuls les fichiers PDF sont acceptés",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !selectedMission || !user) {
      toast({
        title: "Erreur",
        description: "Fichier ou mission non sélectionnés",
        variant: "destructive"
      });
      return;
    }
    try {
      setUploadLoading(true);

      // Générer un chemin unique pour la facture
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `driver_invoices/${selectedMission.id}/${fileName}`;

      // Uploader le fichier
      const uploadedPath = await uploadFile(filePath, selectedFile);
      if (!uploadedPath) {
        throw new Error("Échec de l'upload du fichier");
      }

      // Mettre à jour la mission avec le chemin de la facture
      const { error } = await typedSupabase.from('missions').update({
        chauffeur_invoice: uploadedPath
      }).eq('id', selectedMission.id);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Facture uploadée avec succès"
      });

      // Rafraîchir les données
      fetchMissions();
      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader la facture",
        variant: "destructive"
      });
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
      // Mettre à jour la mission pour supprimer la référence à la facture
      const { error } = await typedSupabase.from('missions').update({
        chauffeur_invoice: null,
        chauffeur_paid: false // Réinitialiser le statut de paiement
      }).eq('id', mission.id);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Facture supprimée avec succès"
      });

      // Rafraîchir les données
      fetchMissions();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture",
        variant: "destructive"
      });
    }
  };

  const handleTogglePaidStatus = async (mission: DriverMission) => {
    if (!mission.chauffeur_invoice) {
      toast({
        title: "Information",
        description: "Une facture doit d'abord être uploadée"
      });
      return;
    }
    try {
      // Inverser le statut de paiement
      const newPaidStatus = !mission.chauffeur_paid;
      const { error } = await typedSupabase.from('missions').update({
        chauffeur_paid: newPaidStatus
      }).eq('id', mission.id);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: newPaidStatus ? "Facture marquée comme payée" : "Facture marquée comme non payée"
      });

      // Rafraîchir les données
      fetchMissions();
    } catch (error) {
      console.error('Error updating paid status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de paiement",
        variant: "destructive"
      });
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
    return currentMonthMissions
      .filter(mission => mission.chauffeur_paid)
      .reduce((sum, mission) => sum + mission.chauffeur_price_ht, 0);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  // Group cards 2 by 2 for the dashboard stats
  const statsData = [
    {
      title: "Revenus du mois",
      description: "Factures payées",
      value: formatPrice(getCurrentMonthRevenue()),
      additionalText: `${stats.paidMissions} facture(s) payée(s) ce mois-ci`,
      className: ""
    },
    {
      title: "En attente",
      description: "Factures non payées",
      value: formatPrice(stats.unpaidAmount),
      additionalText: `${stats.invoicedMissions - stats.paidMissions} facture(s) en attente`,
      className: "text-amber-500"
    },
    {
      title: "Sans facture",
      description: "Missions sans facture",
      value: formatPrice(stats.noInvoiceAmount),
      additionalText: `${stats.uninvoicedMissions} mission(s) sans facture`,
      className: "text-gray-500"
    },
    {
      title: "Total missions",
      description: "Missions terminées",
      value: stats.totalMissions.toString(),
      additionalText: `${stats.totalMissions} mission(s) terminée(s)`,
      className: ""
    }
  ];

  // Function to chunk array into pairs
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  // Group stats cards
  const statGroups = chunkArray(statsData, 2);

  // Get a URL with a timestamp to prevent caching
  const getPublicUrlWithTimestamp = (filePath: string) => {
    if (!filePath) return '';
    
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      // Add timestamp to prevent caching issues
      return `${data.publicUrl}?t=${new Date().getTime()}`;
    } catch (error) {
      console.error('Error generating public URL:', error);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Statistiques de facturation montant H.T. €</CardTitle>
            <CardDescription>Synthèse des paiements chauffeur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total restant à payer aux chauffeurs:</span>
                <span className="text-xl font-bold">{formatPrice(totalUnpaid)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {statGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.map((stat, index) => (
                <Card key={index} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <CardDescription>{stat.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xl font-bold", stat.className)}>{stat.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.additionalText}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>{isAdmin ? "Factures des chauffeurs" : "Mes factures"}</CardTitle>
          <CardDescription>{isAdmin ? "Gestion des factures des chauffeurs" : "Gérer vos factures pour chaque mission"}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune mission trouvée
            </div>
          ) : (
            <div className="space-y-4">
              {missions.map((mission) => (
                <Card key={mission.id} className="p-4">
                  {/* Line 1: Mission number */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Mission {mission.mission_number}</h3>
                  </div>
                  
                  {/* Line 2: Status and price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getInvoiceStatusBadge(mission)}
                    </div>
                    <p className="text-sm">
                      Montant: {formatPrice(mission.chauffeur_price_ht)}
                    </p>
                  </div>
                  
                  {/* Line 3: Action buttons - 2x2 grid on mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleUploadClick(mission)}
                    >
                      <Upload size={14} className="mr-1" />
                      Upload
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleViewClick(mission)} 
                      disabled={!mission.chauffeur_invoice}
                    >
                      <Eye size={14} className="mr-1" />
                      Voir
                    </Button>
                    
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteInvoice(mission)} 
                        disabled={!mission.chauffeur_invoice}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Supprimer
                      </Button>
                    )}
                    
                    {isAdmin && (
                      <Button 
                        variant={mission.chauffeur_paid ? "secondary" : "default"} 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleTogglePaidStatus(mission)} 
                        disabled={!mission.chauffeur_invoice}
                      >
                        <Check size={14} className="mr-1" />
                        {mission.chauffeur_paid ? "Annuler" : "Payé"}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
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
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Facture - Mission {selectedMission?.mission_number}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0 overflow-hidden">
            {selectedMission?.chauffeur_invoice && (
              <object
                data={getPublicUrlWithTimestamp(selectedMission.chauffeur_invoice)}
                type="application/pdf"
                className="w-full h-full"
                aria-label={`Facture de la mission ${selectedMission.mission_number}`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="mb-4 text-center">Le navigateur ne peut pas afficher ce PDF</p>
                  <Button 
                    onClick={() => selectedMission.chauffeur_invoice && 
                      handleOpenInNewTab(getPublicUrlWithTimestamp(selectedMission.chauffeur_invoice))}
                    variant="default"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              </object>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fermer
            </Button>
            {selectedMission?.chauffeur_invoice && (
              <Button 
                variant="default"
                onClick={() => handleOpenInNewTab(getPublicUrlWithTimestamp(selectedMission.chauffeur_invoice!))}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir dans un nouvel onglet
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverInvoices;
