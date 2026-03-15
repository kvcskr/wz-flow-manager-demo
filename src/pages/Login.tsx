import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Błąd logowania', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Pobierz rolę bezpośrednio — nie czekaj na async kontekst auth
    const { data: meta } = await supabase
      .from('uzytkownicy_organizacji')
      .select('rola')
      .eq('user_id', signInData.user.id)
      .single();

    if (meta?.rola === 'superadmin') navigate('/superadmin', { replace: true });
    else if (meta?.rola === 'admin') navigate('/dashboard', { replace: true });
    else if (meta?.rola === 'kierowca') navigate('/wz/nowe', { replace: true });
    else {
      toast({ title: 'Błąd', description: 'Brak przypisanej roli dla tego konta.', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">WZ Manager</CardTitle>
          <p className="text-sm text-muted-foreground">Zaloguj się do swojego konta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jan@firma.pl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
