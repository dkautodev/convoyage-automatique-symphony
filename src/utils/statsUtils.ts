
export const formatCurrency = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

// Remplacement des mois anglais par les mois français
export const months = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
