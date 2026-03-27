import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Ustawienia() {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [nazwaNaWz, setNazwaNaWz] = useState('');
  const [nipNaWz, setNipNaWz] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    supabase.from('organizacje').select('nazwa_na_wz, nip_na_wz').eq('id', orgId).single()
      .then(({ data }) => {
        if (data) {
          setNazwaNaWz(data.nazwa_na_wz);
          setNipNaWz(data.nip_na_wz);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await supabase.from('organizacje').update({ nazwa: nazwaNaWz, nazwa_na_wz: nazwaNaWz, nip_na_wz: nipNaWz }).eq('id', orgId);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zapisano', description: 'Ustawienia zostały zaktualizowane.' });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Błąd', description: 'Hasła nie są identyczne.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Błąd', description: 'Hasło musi mieć co najmniej 6 znaków.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zapisano', description: 'Hasło zostało zmienione.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  if (loading) return <AdminLayout><div className="space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Ustawienia</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Dane na dokumentach WZ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nazwa firmy na dokumentach WZ</Label>
            <Input value={nazwaNaWz} onChange={e => setNazwaNaWz(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>NIP na dokumentach WZ</Label>
            <Input value={nipNaWz} onChange={e => setNipNaWz(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-lg mt-6">
        <CardHeader><CardTitle>Zmiana hasła</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nowe hasło</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 znaków" />
          </div>
          <div className="space-y-2">
            <Label>Potwierdź nowe hasło</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Powtórz hasło" />
          </div>
          <Button onClick={handlePasswordChange} disabled={savingPassword || !newPassword || !confirmPassword}>
            <Save className="h-4 w-4 mr-2" /> {savingPassword ? 'Zapisywanie...' : 'Zmień hasło'}
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
