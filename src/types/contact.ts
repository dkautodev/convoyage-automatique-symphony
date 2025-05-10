
export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export type ContactFormData = {
  first_name: string;
  last_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
};
