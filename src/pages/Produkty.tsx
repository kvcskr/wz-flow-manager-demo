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
import { Plus, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Produkty() {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [produkty, setProdukty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editProd, setEditProd] = useState<any>(null);
  const [formNazwa, setFormNazwa] = useState('');
  const [formJednostka, setFormJednostka] = useState('szt.');

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase.from('produkty').select('*').eq('org_id', orgId).order('kolejnosc');
    setProdukty(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    fetchData();
  }, [orgId]);

  const handleAdd = async () => {
    if (!formNazwa.trim() || !orgId) return;
    const maxOrder = produkty.reduce((m, p) => Math.max(m, p.kolejnosc || 0), 0);
    const { error } = await supabase.from('produkty').insert({ org_id: orgId, nazwa: formNazwa.trim(), jednostka: formJednostka.trim() || 'szt.', kolejnosc: maxOrder + 1 });
    if (error) { toast({ title: 'Błąd', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Dodano', description: 'Produkt został dodany.' });
    setFormNazwa(''); setFormJednostka('szt.'); setAddOpen(false);
    fetchData();
  };

  const handleEdit = async () => {
    if (!editProd) return;
    await supabase.from('produkty').update({ nazwa: formNazwa.trim(), jednostka: formJednostka.trim() || 'szt.' }).eq('id', editProd.id);
    toast({ title: 'Zapisano' });
    setEditProd(null);
    fetchData();
  };

  const moveOrder = async (idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= produkty.length) return;
    const a = produkty[idx];
    const b = produkty[swapIdx];
    await Promise.all([
      supabase.from('produkty').update({ kolejnosc: b.kolejnosc }).eq('id', a.id),
      supabase.from('produkty').update({ kolejnosc: a.kolejnosc }).eq('id', b.id),
    ]);
    fetchData();
  };

  const toggleActive = async (p: any) => {
    await supabase.from('produkty').update({ aktywny: !p.aktywny }).eq('id', p.id);
    toast({ title: p.aktywny ? 'Dezaktywowano' : 'Aktywowano' });
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produkty</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Dodaj produkt</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowy produkt</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nazwa *</Label><Input value={formNazwa} onChange={e => setFormNazwa(e.target.value)} /></div>
              <div><Label>Jednostka</Label><Input value={formJednostka} onChange={e => setFormJednostka(e.target.value)} placeholder="szt." /></div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Kolejność</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Jednostka</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produkty.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => moveOrder(idx, -1)} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveOrder(idx, 1)} disabled={idx === produkty.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.nazwa}</TableCell>
                    <TableCell>{p.jednostka}</TableCell>
                    <TableCell><Badge variant={p.aktywny ? 'default' : 'secondary'}>{p.aktywny ? 'Aktywny' : 'Nieaktywny'}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditProd(p); setFormNazwa(p.nazwa); setFormJednostka(p.jednostka); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>{p.aktywny ? 'Dezaktywuj' : 'Aktywuj'}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editProd} onOpenChange={(o) => !o && setEditProd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edytuj produkt</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nazwa</Label><Input value={formNazwa} onChange={e => setFormNazwa(e.target.value)} /></div>
            <div><Label>Jednostka</Label><Input value={formJednostka} onChange={e => setFormJednostka(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleEdit}>Zapisz</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
