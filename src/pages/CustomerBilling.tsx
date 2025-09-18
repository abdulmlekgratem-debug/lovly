import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentRow {
  id: string;
  customer_id: string | null;
  customer_name: string;
  contract_number: string | null;
  amount: number | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  entry_type: 'invoice' | 'receipt' | 'debt' | string | null;
}

interface ContractRow {
  Contract_Number: string | null;
  'Customer Name': string | null;
  'Ad Type': string | null;
  'Total Rent': string | number | null;
  'Start Date'?: string | null;
  'End Date'?: string | null;
  customer_id?: string | null;
}

export default function CustomerBilling() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const paramId = params.get('id') || '';
  const paramName = params.get('name') || '';

  const [customerId, setCustomerId] = useState<string>(paramId);
  const [customerName, setCustomerName] = useState<string>(paramName);

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<'invoice'|'receipt'>('invoice');
  const [addAmount, setAddAmount] = useState('');
  const [addMethod, setAddMethod] = useState('');
  const [addReference, setAddReference] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addDate, setAddDate] = useState<string>(()=> new Date().toISOString().slice(0,10));
  const [addContract, setAddContract] = useState<string>('');

  const [editReceiptOpen, setEditReceiptOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<PaymentRow | null>(null);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptMethod, setReceiptMethod] = useState('');
  const [receiptReference, setReceiptReference] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptDate, setReceiptDate] = useState('');

  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');
  const [debtDate, setDebtDate] = useState<string>(()=> new Date().toISOString().slice(0,10));

  useEffect(() => {
    (async () => {
      try {
        // Resolve name if only id is provided or vice versa
        if (customerId && !customerName) {
          const { data } = await supabase.from('customers').select('name').eq('id', customerId).single();
          setCustomerName(data?.name || '');
        }
        if (!customerId && customerName) {
          const { data } = await supabase.from('customers').select('id').ilike('name', customerName).limit(1).maybeSingle();
          if (data?.id) setCustomerId(data.id);
        }
      } catch {}
    })();
  }, [customerId, customerName]);

  const loadData = async () => {
    try {
      let paymentsData: PaymentRow[] = [];
      if (customerId) {
        const p = await supabase.from('customer_payments').select('*').eq('customer_id', customerId).order('paid_at', { ascending: false });
        if (!p.error) paymentsData = p.data || [];
      }
      if ((!paymentsData || paymentsData.length === 0) && customerName) {
        const p = await supabase.from('customer_payments').select('*').ilike('customer_name', `%${customerName}%`).order('paid_at', { ascending: false });
        if (!p.error) paymentsData = p.data || [];
      }
      setPayments(paymentsData);

      let contractsData: ContractRow[] = [];
      if (customerId) {
        const c = await supabase.from('Contract').select('*').eq('customer_id', customerId);
        if (!c.error) contractsData = c.data || [];
      }
      if ((!contractsData || contractsData.length === 0) && customerName) {
        const c = await supabase.from('Contract').select('*').ilike('Customer Name', `%${customerName}%`);
        if (!c.error) contractsData = c.data || [];
      }
      setContracts(contractsData);
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل البيانات');
    }
  };

  useEffect(() => { loadData(); }, [customerId, customerName]);

  const totalRent = useMemo(() => contracts.reduce((s, c) => s + (Number(c['Total Rent']) || 0), 0), [contracts]);
  const totalPaid = useMemo(() => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0), [payments]);
  const balance = Math.max(0, totalRent - totalPaid);

  const openEditReceipt = (payment: PaymentRow) => {
    setEditingReceipt(payment);
    setReceiptAmount(String(payment.amount || ''));
    setReceiptMethod(payment.method || '');
    setReceiptReference(payment.reference || '');
    setReceiptNotes(payment.notes || '');
    setReceiptDate(payment.paid_at ? payment.paid_at.split('T')[0] : '');
    setEditReceiptOpen(true);
  };

  const saveReceiptEdit = async () => {
    if (!editingReceipt) return;
    try {
      const { error } = await supabase.from('customer_payments').update({
        amount: Number(receiptAmount) || 0,
        method: receiptMethod || null,
        reference: receiptReference || null,
        notes: receiptNotes || null,
        paid_at: receiptDate ? new Date(receiptDate).toISOString() : null,
      }).eq('id', editingReceipt.id).select();
      if (error) { toast.error('فشل في تحديث الإيصال'); return; }
      toast.success('تم تحديث الإيصال');
      setEditReceiptOpen(false); setEditingReceipt(null);
      await loadData();
    } catch (e) {
      console.error(e); toast.error('خطأ في حفظ الإيصال');
    }
  };

  const deleteReceipt = async (id: string) => {
    if (!window.confirm('تأكيد حذف الإيصال؟')) return;
    try {
      const { error } = await supabase.from('customer_payments').delete().eq('id', id);
      if (error) { toast.error('فشل الحذف'); return; }
      toast.success('تم الحذف');
      await loadData();
    } catch (e) { console.error(e); toast.error('خطأ في الحذف'); }
  };

  const printStatement = () => {
    const rows = payments.slice().sort((a,b)=> (new Date(a.paid_at||'').getTime()) - (new Date(b.paid_at||'').getTime()));
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8" />
      <title>كشف حساب - ${customerName}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;max-width:900px;margin:auto}
      h1{font-size:22px;margin:0 0 10px} table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #ddd;padding:8px;text-align:center} .right{text-align:right}
      .summary{margin-top:12px}</style></head><body>
      <h1>كشف حساب</h1>
      <div class="right">العميل: ${customerName}</div>
      <div class="right">إجمالي العقود: ${totalRent.toLocaleString('ar-LY')} د.ل</div>
      <div class="right">إجمالي المدفوع: ${totalPaid.toLocaleString('ar-LY')} د.ل</div>
      <div class="right">المتبقي: ${balance.toLocaleString('ar-LY')} د.ل</div>
      <table><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>المرجع</th><th>ملاحظات</th></tr></thead><tbody>
      ${rows.map(r=> `<tr><td>${r.paid_at ? new Date(r.paid_at).toLocaleDateString('ar-LY') : ''}</td><td>${r.entry_type||''}</td><td>${(Number(r.amount)||0).toLocaleString('ar-LY')} د.ل</td><td>${r.reference||''}</td><td>${r.notes||''}</td></tr>`).join('')}
      </tbody></table>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">فواتير وإيصالات العميل</h1>
          <p className="text-muted-foreground">{customerName || '—'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/customers')}>رجوع للزبائن</Button>
          <Button onClick={printStatement}>طباعة كشف حساب</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>عقود العميل ({contracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العقد</TableHead>
                    <TableHead>نوع الإعلان</TableHead>
                    <TableHead>تاريخ البداية</TableHead>
                    <TableHead>تاريخ النهاية</TableHead>
                    <TableHead>القيمة الإجمالية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(ct => (
                    <TableRow key={String(ct.Contract_Number)}>
                      <TableCell className="font-medium">{String(ct.Contract_Number||'')}</TableCell>
                      <TableCell>{ct['Ad Type'] || '—'}</TableCell>
                      <TableCell>{ct['Start Date'] ? new Date(ct['Start Date']).toLocaleDateString('ar-LY') : '—'}</TableCell>
                      <TableCell>{ct['End Date'] ? new Date(ct['End Date']).toLocaleDateString('ar-LY') : '—'}</TableCell>
                      <TableCell className="font-semibold">{(Number(ct['Total Rent'])||0).toLocaleString('ar-LY')} د.ل</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <div className="text-center text-muted-foreground py-6">لا توجد عقود</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الدفعات والإيصالات ({payments.length})</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setAddDebtOpen(true); setDebtAmount(''); setDebtNotes(''); setDebtDate(new Date().toISOString().slice(0,10)); }}>إضافة دين سابق</Button>
              <Button size="sm" onClick={() => { setAddType('invoice'); setAddOpen(true); setAddAmount(''); setAddMethod(''); setAddReference(''); setAddNotes(''); setAddDate(new Date().toISOString().slice(0,10)); setAddContract(contracts[0]?.Contract_Number ? String(contracts[0]?.Contract_Number) : ''); }}>إضافة فاتورة (سجل)</Button>
              <Button size="sm" variant="outline" onClick={() => { setAddType('receipt'); setAddOpen(true); setAddAmount(''); setAddMethod(''); setAddReference(''); setAddNotes(''); setAddDate(new Date().toISOString().slice(0,10)); setAddContract(contracts[0]?.Contract_Number ? String(contracts[0]?.Contract_Number) : ''); }}>إضافة إيصال</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العقد</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>المرجع</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.contract_number || '—'}</TableCell>
                      <TableCell>{p.entry_type || '—'}</TableCell>
                      <TableCell className="text-green-600 font-semibold">{(Number(p.amount)||0).toLocaleString('ar-LY')} د.ل</TableCell>
                      <TableCell>{p.method || '—'}</TableCell>
                      <TableCell>{p.reference || '—'}</TableCell>
                      <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('ar-LY') : '—'}</TableCell>
                      <TableCell>{p.notes || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            const html = `<!DOCTYPE html><html dir='rtl'><head><meta charset='utf-8'><title>إيصال دفع</title><style>body{font-family:Arial;padding:20px;max-width:600px;margin:auto} .title{font-size:22px;font-weight:bold} table{width:100%;border-collapse:collapse;margin-top:10px} td{padding:6px}</style></head><body><div class='title'>إيصال دفع</div><table><tr><td>العميل</td><td>${customerName}</td></tr><tr><td>رقم العقد</td><td>${p.contract_number||'—'}</td></tr><tr><td>النوع</td><td>${p.entry_type||''}</td></tr><tr><td>المبلغ</td><td>${(Number(p.amount)||0).toLocaleString('ar-LY')} د.ل</td></tr><tr><td>التاريخ</td><td>${p.paid_at ? new Date(p.paid_at).toLocaleString('ar-LY') : ''}</td></tr><tr><td>المرجع</td><td>${p.reference||''}</td></tr><tr><td>ملاحظات</td><td>${p.notes||''}</td></tr></table><script>window.onload=function(){window.print();}</script></body></html>`;
                            const w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(html); w.document.close(); }
                          }}>طباعة إيصال</Button>
                          <Button size="sm" variant="outline" onClick={() => openEditReceipt(p)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteReceipt(p.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <div className="text-center text-muted-foreground py-6">لا توجد دفعات</div>}
        </CardContent>
      </Card>

      {/* Add invoice/receipt dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{addType==='invoice' ? 'إضافة فاتورة' : 'إضافة إيصال'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">العميل: {customerName}</div>
            <div>
              <label className="text-sm font-medium">العقد</label>
              <Select value={addContract} onValueChange={setAddContract}>
                <SelectTrigger><SelectValue placeholder="اختر عقدًا" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {contracts.map((ct)=> (
                    <SelectItem key={String(ct.Contract_Number)} value={String(ct.Contract_Number)}>{String(ct.Contract_Number)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">المبلغ</label>
              <Input type="number" value={addAmount} onChange={(e)=> setAddAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select value={addMethod} onValueChange={setAddMethod}>
                <SelectTrigger><SelectValue placeholder="اختر طريقة الدفع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقدي">نقدي</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="شيك">شيك</SelectItem>
                  <SelectItem value="بطاقة ائتما��">بطاقة ائتمان</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">المرجع</label>
              <Input value={addReference} onChange={(e)=> setAddReference(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">التاريخ</label>
              <Input type="date" value={addDate} onChange={(e)=> setAddDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={addNotes} onChange={(e)=> setAddNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=> setAddOpen(false)}>إلغاء</Button>
              <Button onClick={async () => {
                try {
                  if (!addAmount || !addContract) { toast.error('أكمل البيانات'); return; }
                  const amt = Number(addAmount);
                  if (!amt || amt <= 0) { toast.error('المبلغ يجب أن يكون أكبر من صفر'); return; }
                  const payload: Partial<PaymentRow> = {
                    customer_id: customerId || null,
                    customer_name: customerName,
                    contract_number: addContract || null,
                    amount: amt,
                    method: addMethod || null,
                    reference: addReference || null,
                    notes: addNotes || null,
                    paid_at: addDate ? new Date(addDate).toISOString() : new Date().toISOString(),
                    entry_type: addType,
                  } as any;
                  const { error } = await supabase.from('customer_payments').insert(payload).select();
                  if (error) { console.error(error); toast.error('فشل الحفظ'); return; }
                  toast.success('تم الحفظ');
                  setAddOpen(false);
                  await loadData();
                } catch (e) { console.error(e); toast.error('خطأ غير متوقع'); }
              }}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit receipt dialog */}
      <Dialog open={editReceiptOpen} onOpenChange={setEditReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تعديل الإيصال</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">المبلغ</label>
              <Input type="number" value={receiptAmount} onChange={(e)=> setReceiptAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select value={receiptMethod} onValueChange={setReceiptMethod}>
                <SelectTrigger><SelectValue placeholder="اختر طريقة الدفع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقدي">نقدي</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="شيك">شيك</SelectItem>
                  <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">المرجع</label>
              <Input value={receiptReference} onChange={(e)=> setReceiptReference(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">تاريخ الدفع</label>
              <Input type="date" value={receiptDate} onChange={(e)=> setReceiptDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={receiptNotes} onChange={(e)=> setReceiptNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=> setEditReceiptOpen(false)}>إلغاء</Button>
              <Button onClick={saveReceiptEdit}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add previous debt */}
      <Dialog open={addDebtOpen} onOpenChange={setAddDebtOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إضافة دين سابق</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">المبلغ</label>
              <Input type="number" value={debtAmount} onChange={(e)=> setDebtAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={debtNotes} onChange={(e)=> setDebtNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">التاريخ</label>
              <Input type="date" value={debtDate} onChange={(e)=> setDebtDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=> setAddDebtOpen(false)}>إلغاء</Button>
              <Button onClick={async () => {
                try {
                  if (!debtAmount) { toast.error('أدخل المبلغ'); return; }
                  const amt = Number(debtAmount);
                  if (!amt || amt <= 0) { toast.error('المبلغ يجب أن يكون أكبر من صفر'); return; }
                  const payload: Partial<PaymentRow> = {
                    customer_id: customerId || null,
                    customer_name: customerName,
                    contract_number: null,
                    amount: amt,
                    method: 'دين سابق',
                    reference: null,
                    notes: debtNotes || null,
                    paid_at: debtDate ? new Date(debtDate).toISOString() : new Date().toISOString(),
                    entry_type: 'debt',
                  } as any;
                  const { error } = await supabase.from('customer_payments').insert(payload).select();
                  if (error) { console.error(error); toast.error('فشل الحفظ'); return; }
                  toast.success('تمت الإضافة');
                  setAddDebtOpen(false);
                  await loadData();
                } catch (e) { console.error(e); toast.error('خطأ غير متوقع'); }
              }}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
