import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SuperadminLayout } from '@/components/SuperadminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Eye, Plus, Save } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

export default function Superadmin() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editExpires, setEditExpires] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newNazwa, setNewNazwa] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [orgRes, memRes] = await Promise.all([
      supabase.from('organizacje').select('*').order('nazwa'),
      supabase.from('uzytkownicy_organizacji').select('*'),
    ]);
    setOrgs(orgRes.data || []);
    setMembers(memRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Nasłuchuj na zmiany w organizacjach i użytkownikach — odśwież automatycznie
    const channel = supabase
      .channel('superadmin-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'organizacje' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'uzytkownicy_organizacji' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'uzytkownicy_organizacji' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getOrgMembers = (orgId: string) => members.filter(m => m.org_id === orgId);
  const countByRole = (orgId: string, role: string) => getOrgMembers(orgId).filter(m => m.rola === role).length;

  const openDetails = (org: any) => {
    setSelectedOrg(org);
    setEditStatus(org.subscription_status);
    setEditExpires(org.subscription_expires_at ? new Date(org.subscription_expires_at) : undefined);
  };

  const handleSave = async () => {
    if (!selectedOrg) return;
    setSaving(true);
    const { error } = await supabase.from('organizacje').update({
      subscription_status: editStatus,
      subscription_expires_at: editExpires ? format(editExpires, 'yyyy-MM-dd') : null,
    }).eq('id', selectedOrg.id);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zapisano', description: 'Dane organizacji zostały zaktualizowane.' });
      fetchData();
    }
    setSaving(false);
  };

  const handleAddOrg = async () => {
    if (!newNazwa.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('organizacje').insert({
      nazwa: newNazwa.trim(),
      nip: newNip.trim() || null,
      email_kontaktowy: newEmail.trim() || null,
      nazwa_na_wz: newNazwa.trim(),
      nip_na_wz: newNip.trim() || '',
      subscription_status: 'trial',
    });
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dodano', description: `Organizacja "${newNazwa}" została dodana.` });
      setNewNazwa(''); setNewNip(''); setNewEmail('');
      setAddOpen(false);
      fetchData();
    }
    setAdding(false);
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'default';
    if (s === 'trial') return 'secondary';
    return 'destructive';
  };

  return (
    <SuperadminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Organizacje</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Dodaj organizację</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowa organizacja</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Nazwa firmy *</Label>
                <Input value={newNazwa} onChange={e => setNewNazwa(e.target.value)} placeholder="np. Polix" />
              </div>
              <div className="space-y-1">
                <Label>NIP</Label>
                <Input value={newNip} onChange={e => setNewNip(e.target.value)} placeholder="7941827391" />
              </div>
              <div className="space-y-1">
                <Label>Email kontaktowy</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="kontakt@firma.pl" />
              </div>
              <Button onClick={handleAddOrg} disabled={adding || !newNazwa.trim()} className="w-full">
                {adding ? 'Dodawanie...' : 'Dodaj organizację'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : orgs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Brak organizacji</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa firmy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Adminów</TableHead>
                    <TableHead className="text-right">Kierowców</TableHead>
                    <TableHead className="text-right">Kwota/mies.</TableHead>
                    <TableHead>Ważna do</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map(org => {
                    const admins = countByRole(org.id, 'admin');
                    const drivers = countByRole(org.id, 'kierowca');
                    const kwota = (admins + drivers) * 100;
                    return (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.nazwa}</TableCell>
                        <TableCell><Badge variant={statusColor(org.subscription_status) as any}>{org.subscription_status}</Badge></TableCell>
                        <TableCell className="text-right">{admins}</TableCell>
                        <TableCell className="text-right">{drivers}</TableCell>
                        <TableCell className="text-right">{kwota} PLN</TableCell>
                        <TableCell>{org.subscription_expires_at ? formatDate(org.subscription_expires_at) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => openDetails(org)}>
                                <Eye className="h-4 w-4 mr-1" /> Szczegóły
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto">
                              <SheetHeader><SheetTitle>{org.nazwa}</SheetTitle></SheetHeader>
                              <div className="mt-6 space-y-6">
                                <div>
                                  <p className="text-sm text-muted-foreground">NIP</p>
                                  <p>{org.nip || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Email kontaktowy</p>
                                  <p>{org.email_kontaktowy || '—'}</p>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Użytkownicy</h3>
                                  <div className="space-y-2">
                                    {getOrgMembers(org.id).map(m => (
                                      <div key={m.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                        <span>{m.email || <span className="font-mono text-xs">{m.user_id.substring(0, 12)}...</span>}</span>
                                        <Badge variant="secondary">{m.rola}</Badge>
                                      </div>
                                    ))}
                                    {getOrgMembers(org.id).length === 0 && <p className="text-sm text-muted-foreground">Brak użytkowników</p>}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h3 className="font-semibold">Subskrypcja</h3>
                                  <div>
                                    <Label>Status</Label>
                                    <Select value={editStatus} onValueChange={setEditStatus}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="trial">trial</SelectItem>
                                        <SelectItem value="active">active</SelectItem>
                                        <SelectItem value="inactive">inactive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Ważna do</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !editExpires && 'text-muted-foreground')}>
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {editExpires ? format(editExpires, 'dd.MM.yyyy') : 'Wybierz datę'}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={editExpires} onSelect={setEditExpires} initialFocus className="p-3 pointer-events-auto" />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <Button onClick={handleSave} disabled={saving} className="w-full">
                                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                  </Button>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </SuperadminLayout>
  );
}
