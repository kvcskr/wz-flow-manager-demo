import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { Plus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Klienci() {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [klienci, setKlienci] = useState<any[]>([]);
  const [produkty, setProdukty] = useState<any[]>([]);
  const [ceny, setCeny] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editKlient, setEditKlient] = useState<any>(null);
  const [formNazwa, setFormNazwa] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formCeny, setFormCeny] = useState<Record<string, string>>({});

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    const [kRes, pRes, cRes] = await Promise.all([
      supabase.from('klienci').select('*').eq('org_id', orgId).order('nazwa'),
      supabase.from('produkty').select('id, nazwa').eq('org_id', orgId).eq('aktywny', true).order('kolejnosc'),
      supabase.from('ceny_klientow').select('*'),
    ]);
    setKlienci(kRes.data || []);
    setProdukty(pRes.data || []);
    setCeny(cRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    fetchData();
  }, [orgId]);

  const getCena = (klientId: string, produktId: string) => {
    return ceny.find(c => c.klient_id === klientId && c.produkt_id === produktId)?.cena_jednostkowa ?? 0;
  };

  const handleAdd = async () => {
    if (!formNazwa.trim() || !orgId) return;
    const { data: newKlient, error } = await supabase.from('klienci').insert({ org_id: orgId, nazwa: formNazwa.trim(), nip: formNip.trim() || null }).select().single();
    if (error) { toast({ title: 'Błąd', description: error.message, variant: 'destructive' }); return; }

    // Create price entries for all active products
    if (newKlient && produkty.length > 0) {
      await supabase.from('ceny_klientow').insert(
        produkty.map(p => ({ klient_id: newKlient.id, produkt_id: p.id, cena_jednostkowa: 0 }))
      );
    }

    toast({ title: 'Dodano', description: 'Klient został dodany.' });
    setFormNazwa(''); setFormNip(''); setAddOpen(false);
    fetchData();
  };

  const openEdit = (k: any) => {
    setEditKlient(k);
    setFormNazwa(k.nazwa);
    setFormNip(k.nip || '');
    const priceMap: Record<string, string> = {};
    produkty.forEach(p => { priceMap[p.id] = String(getCena(k.id, p.id)); });
    setFormCeny(priceMap);
  };

  const handleEdit = async () => {
    if (!editKlient) return;
    await supabase.from('klienci').update({ nazwa: formNazwa.trim(), nip: formNip.trim() || null }).eq('id', editKlient.id);

    await Promise.all(produkty.map(p => {
      const val = parseFloat(formCeny[p.id] || '0') || 0;
      const existing = ceny.find(c => c.klient_id === editKlient.id && c.produkt_id === p.id);
      if (existing) {
        return supabase.from('ceny_klientow').update({ cena_jednostkowa: val }).eq('id', existing.id);
      } else {
        return supabase.from('ceny_klientow').insert({ klient_id: editKlient.id, produkt_id: p.id, cena_jednostkowa: val });
      }
    }));

    toast({ title: 'Zapisano', description: 'Dane klienta zostały zaktualizowane.' });
    setEditKlient(null);
    fetchData();
  };

  const toggleActive = async (k: any) => {
    await supabase.from('klienci').update({ aktywny: !k.aktywny }).eq('id', k.id);
    toast({ title: k.aktywny ? 'Dezaktywowano' : 'Aktywowano' });
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Klienci</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Dodaj klienta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowy klient</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nazwa *</Label><Input value={formNazwa} onChange={e => setFormNazwa(e.target.value)} /></div>
              <div><Label>NIP</Label><Input value={formNip} onChange={e => setFormNip(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd} disabled={!formNazwa.trim()}>Dodaj</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Status</TableHead>
                    {produkty.map(p => <TableHead key={p.id} className="text-right">{p.nazwa}</TableHead>)}
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {klienci.map(k => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.nazwa}</TableCell>
                      <TableCell>{k.nip || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={k.aktywny ? 'default' : 'secondary'}>{k.aktywny ? 'Aktywny' : 'Nieaktywny'}</Badge>
                      </TableCell>
                      {produkty.map(p => (
                        <TableCell key={p.id} className="text-right">{formatCurrency(getCena(k.id, p.id))}</TableCell>
                      ))}
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(k)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(k)}>
                          {k.aktywny ? 'Dezaktywuj' : 'Aktywuj'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editKlient} onOpenChange={(o) => !o && setEditKlient(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edytuj klienta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nazwa</Label><Input value={formNazwa} onChange={e => setFormNazwa(e.target.value)} /></div>
            <div><Label>NIP</Label><Input value={formNip} onChange={e => setFormNip(e.target.value)} /></div>
            {produkty.map(p => (
              <div key={p.id}>
                <Label>Cena {p.nazwa} (PLN)</Label>
                <Input type="number" step="0.01" min="0" value={formCeny[p.id] || '0'} onChange={e => setFormCeny(prev => ({ ...prev, [p.id]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter><Button onClick={handleEdit}>Zapisz</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
