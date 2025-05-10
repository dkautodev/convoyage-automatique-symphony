
export interface Contact {
  id: number;
  name_s: string | null;
  email?: string | null;
  phone?: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export type ContactFormData = {
  name_s: string;
  email?: string;
  phone?: string;
};
