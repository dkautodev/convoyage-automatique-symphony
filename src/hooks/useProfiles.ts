export const useProfiles = (role: UserRole) => {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, company_name, email')
          .eq('role', role)
          .eq('active', true)
          .order('company_name', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        // Formater les données
        const options = data.map(profile => ({
          id: profile.id,
          label: role === 'client' 
            ? (profile.company_name || profile.full_name || profile.email)
            : (profile.full_name || profile.email),
          email: profile.email
        }));
        
        console.log(`Loaded ${options.length} ${role} profiles:`, options);
        setProfiles(options);
      } catch (err) {
        console.error(`Erreur lors de la récupération des ${role}s:`, err);
        setError("Impossible de charger les profils");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [role]);
  
  return { profiles, loading, error };
};