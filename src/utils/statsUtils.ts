
export const formatCurrency = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
