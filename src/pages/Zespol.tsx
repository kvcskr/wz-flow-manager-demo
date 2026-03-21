import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Zespol() {
  const { orgId, user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('kierowca');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from('uzytkownicy_organizacji')
      .select('*')
      .eq('org_id', orgId)
      .order('utworzono');
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    fetchData();
  }, [orgId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !invitePassword.trim() || !orgId) return;
    setInviting(true);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-team-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email: inviteEmail.trim(), password: invitePassword.trim(), role: inviteRole }),
    });

    const result = await res.json();
    if (!res.ok) {
      toast({ title: 'Błąd', description: result.error || 'Nie udało się utworzyć konta.', variant: 'destructive' });
    } else {
      toast({ title: 'Gotowe', description: `Konto dla ${inviteEmail} zostało utworzone.` });
      setInviteOpen(false);
      setInviteEmail('');
      setInvitePassword('');
      fetchData();
    }
    setInviting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('uzytkownicy_organizacji').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usunięto', description: 'Użytkownik został usunięty z zespołu.' });
      fetchData();
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Zespół</h1>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Zaproś użytkownika</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Zaproś użytkownika</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="kierowca@firma.pl" /></div>
              <div><Label>Hasło startowe</Label><Input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="min. 6 znaków" /></div>
              <div>
                <Label>Rola</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kierowca">Kierowca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleInvite} disabled={!inviteEmail.trim() || !invitePassword.trim() || inviting}>{inviting ? 'Tworzenie...' : 'Utwórz konto'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Data dodania</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{m.email || <span className="text-muted-foreground text-xs font-mono">{m.user_id.substring(0, 8)}...</span>}</TableCell>
                    <TableCell>
                      <Badge variant={m.rola === 'admin' ? 'default' : 'secondary'}>{m.rola}</Badge>
                    </TableCell>
                    <TableCell>{m.utworzono ? formatDate(m.utworzono) : '—'}</TableCell>
                    <TableCell className="text-right">
                      {m.user_id !== user?.id && (
                        <Dialog open={deleteId === m.id} onOpenChange={(o) => !o && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Usunąć użytkownika?</DialogTitle>
                              <DialogDescription>Użytkownik straci dostęp do organizacji.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>Anuluj</Button>
                              <Button variant="destructive" onClick={handleDelete}>Usuń</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
