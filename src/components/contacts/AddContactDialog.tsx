
import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactFormData } from '@/types/contact';
import { UserPlus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddContactDialogProps {
  onAddContact: (data: ContactFormData) => Promise<void>;
}

export const AddContactDialog: React.FC<AddContactDialogProps> = ({ onAddContact }) => {
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<ContactFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      email: '',
      phone: ''
    }
  });
  
  const handleSubmit = async (data: ContactFormData) => {
    await onAddContact(data);
    form.reset();
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un contact</DialogTitle>
          <DialogDescription>
            Créez un nouveau contact qui pourra être utilisé lors de la création d'une mission.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Jean" 
                        {...field} 
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Dupont" 
                        {...field} 
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Société (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Entreprise SA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="06 12 34 56 78" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="jean.dupont@exemple.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">Enregistrer le contact</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
