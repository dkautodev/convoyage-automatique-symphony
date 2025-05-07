
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateSiret = (siret: string): boolean => {
  // Remove spaces and check if it's 14 digits
  return /^\d{14}$/.test(siret.replace(/\s/g, ''));
};

export const validateTva = (tva: string): boolean => {
  // Basic TVA validation - more complex rules can be added
  return /^[A-Za-z]{2}\d{2,12}$/.test(tva.replace(/\s/g, ''));
};

export const validatePhone = (phone: string): boolean => {
  // Accept international format +XX XXXXXXXXXX
  return /^\+\d{1,4}\s?\d{6,14}$/.test(phone.replace(/\s/g, ''));
};

export const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = 
    [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  if (password.length < 8) return 'weak';
  if (strength <= 2) return 'weak';
  if (strength === 3) return 'medium';
  return 'strong';
};

export const isAdminEmailAllowed = (email: string): boolean => {
  // Example validation - check if email is from allowed domain
  // In production, this would connect to a database of allowed domains
  const allowedDomains = ['entreprise.com'];
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

export const formatSiret = (value: string): string => {
  // Format as XXX XXX XXX XXXXX
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
};
