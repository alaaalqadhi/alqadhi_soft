
import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  PlusCircleIcon, 
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  PrinterIcon,
  ArrowRightOnRectangleIcon,
  DocumentPlusIcon,
  ArchiveBoxIcon,
  IdentificationIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { PlateRecord } from './types';
import LoginPage from './components/LoginPage';
import { db } from './services/db';
import { generateArchiveSummary } from './services/geminiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'SEARCH'>('REGISTER');
  const [activeEntity, setActiveEntity] = useState<'mukafaha' | 'bahth' | 'mutabaa'>('mukafaha');
  const [records, setRecords] = useState<PlateRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/db-status');
        if (res.ok) setDbStatus('connected');
        else setDbStatus('error');
      } catch {
        setDbStatus('error');
      }
    };
    checkStatus();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const initialForm: Partial<PlateRecord> = {
    plateNumber: '',
    category: '', 
    plateType: 'خصوصي',
    quantity: '1',
    reportNumber: '',
    seizureDate: new Date().toISOString().split('T')[0],
    trafficSupplyDate: new Date().toISOString().split('T')[0],
    vehicleModel: '',
    supplyingEntity: 'مكافحة',
    seizedItems: '',
    actionsTaken: '',
    notes: ''
  };

  const [formData, setFormData] = useState<Partial<PlateRecord>>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadAllRecords();
    }
  }, [isLoggedIn, activeEntity]);

  useEffect(() => {
    console.log(`Current ${activeEntity} records state count:`, records.length);
  }, [records, activeEntity]);

  const loadAllRecords = async () => {
    try {
      if (!db.isOpen()) await db.open();
      const all = await db.plates.reverse(activeEntity).toArray();
      console.log(`Fetched ${activeEntity} records from DB:`, all);
      setRecords(all);
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error);
      alert("فشل في جلب البيانات من قاعدة البيانات. يرجى التحقق من اتصال الإنترنت أو إعدادات السيرفر.");
    }
  };

  const handleLogin = (user: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  const handleExportData = () => {
    const element = document.getElementById('printable-archive');
    if (!element) {
      alert("لم يتم العثور على بيانات لتصديرها");
      return;
    }

    // إنشاء نسخة مؤقتة للتعديل عليها قبل التصدير
    const clone = element.cloneNode(true) as HTMLElement;
    
    // إظهار الهيدر المخصص للطباعة في النسخة المنسوخة
    const pdfHeader = clone.querySelector('.pdf-header');
    if (pdfHeader) {
      pdfHeader.classList.remove('hidden');
      pdfHeader.classList.remove('print:block');
    }

    // تحسين التنسيق ليكون "سطر بعد سطر" بشكل متسلسل وواضح
    clone.style.padding = '5px';
    const table = clone.querySelector('table');
    if (table) {
      table.style.fontSize = '7px'; // تصغير الخط قليلاً لضمان استيعاب البيانات
      table.style.width = '100%';
      table.style.tableLayout = 'fixed';
      table.querySelectorAll('th, td').forEach((el: any) => {
        el.style.padding = '3px 1px';
        el.style.border = '1px solid #000';
        el.style.wordBreak = 'break-word';
        el.style.overflow = 'hidden';
      });
      
      // تخصيص عرض الأعمدة برمجياً لضمان أفضل نتيجة في PDF
      const headers = table.querySelectorAll('th');
      const widths = ['3%', '7%', '8%', '6%', '7%', '4%', '8%', '8%', '8%', '8%', '8%', '20%', '10%'];
      headers.forEach((th, i) => {
        if (widths[i]) th.style.width = widths[i];
      });
    }

    // إزالة أزرار الإجراءات (تعديل/حذف) من النسخة المنسوخة
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    // إعداد خيارات التصدير
    const opt = {
      margin:       [10, 10] as [number, number],
      filename:     `أرشيف_مرور_تعز_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };

    // تنفيذ عملية التصدير من النسخة المعدلة
    html2pdf().set(opt).from(clone).save().catch((err: any) => {
      console.error("PDF Export Error:", err);
      alert("حدث خطأ أثناء تصدير ملف PDF");
    });
  };

  const handleGenerateSummary = async () => {
    if (filteredRecords.length === 0) {
      alert("لا توجد بيانات لتوليد ملخص لها.");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const summary = await generateArchiveSummary(filteredRecords);
      setAiSummary(summary);
    } catch (error) {
      alert("فشل توليد الملخص الذكي.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plateNumber || !formData.category) {
      alert("يرجى إدخال رقم اللوحة والفاصل");
      return;
    }
    setLoading(true);
    try {
      if (!db.isOpen()) await db.open();
      
      if (editingId) {
        const result = await db.plates.update(editingId, formData, activeEntity);
        if (result.success) {
          setEditingId(null);
          setSaveSuccess(true);
          alert(result.message);
        }
      } else {
        const newRecord: PlateRecord = {
          ...formData as PlateRecord,
          id: Math.random().toString(36).substr(2, 9),
          entryDate: new Date().toISOString(),
          status: 'COMPLETED'
        };
        const result = await db.plates.add(newRecord, activeEntity);
        if (result.success) {
          setSaveSuccess(true);
          alert(result.message);
        }
      }
      
      setTimeout(() => setSaveSuccess(false), 3000);
      
      setFormData(initialForm);
      await loadAllRecords();
      setTimeout(() => setActiveTab('SEARCH'), 500);
    } catch (error) {
      alert("فشل في حفظ البيانات: " + error);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (record: PlateRecord) => {
    setEditingId(record.id);
    // تأمين البيانات لضمان عدم وجود قيم null تؤدي لتحذيرات في React
    const sanitizedRecord = {
      ...record,
      plateNumber: record.plateNumber || '',
      category: record.category || '',
      plateType: record.plateType || 'خصوصي',
      quantity: record.quantity || '1',
      reportNumber: record.reportNumber || '',
      seizureDate: record.seizureDate || '',
      trafficSupplyDate: record.trafficSupplyDate || '',
      vehicleModel: record.vehicleModel || '',
      supplyingEntity: record.supplyingEntity || 'مكافحة',
      seizedItems: record.seizedItems || '',
      actionsTaken: record.actionsTaken || '',
      notes: record.notes || ''
    };
    setFormData(sanitizedRecord);
    setActiveTab('REGISTER');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id: string) => {
    if (!id) {
      alert("خطأ: معرف السجل غير موجود");
      return;
    }
    
    if (window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) {
      setLoading(true);
      try {
        const result = await db.plates.delete(id, activeEntity);
        if (result.success) {
          alert(result.message);
          await loadAllRecords();
        } else {
          alert("فشل الحذف: " + (result as any).error);
        }
      } catch (error) {
        console.error("Error deleting record:", error);
        alert("حدث خطأ أثناء الاتصال بالخادم للحذف");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredRecords = records.filter(r => {
    const s = searchTerm.toLowerCase().trim();
    const plate = String(r.plateNumber || '').toLowerCase();
    const category = String(r.category || '').toLowerCase();
    const matchesSearch = !s || plate.includes(s) || category.includes(s);
    const matchesDate = (!dateFrom || (r.seizureDate && r.seizureDate >= dateFrom)) && (!dateTo || (r.seizureDate && r.seizureDate <= dateTo));
    return matchesSearch && matchesDate;
  });

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 font-cairo text-slate-900 print:bg-white selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-indigo-900 text-white shadow-2xl print:hidden sticky top-0 z-30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg border border-white/10">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">الأرشفة الذكية لمخازن مرور م. تعز</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest text-indigo-300">Taiz Traffic Department Smart Archive</p>
                <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : dbStatus === 'error' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`}></span>
                <span className="text-[9px] font-bold opacity-50">
                  {dbStatus === 'connected' ? 'متصل' : dbStatus === 'error' ? 'خطأ في الاتصال' : 'جاري الاتصال...'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end ml-4">
              <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded uppercase text-slate-200">إدارة المخازن</span>
              <p className="font-bold text-lg leading-none mt-1">{records.length} سجل محفوظ</p>
            </div>
            <button onClick={handleLogout} className="bg-white/5 hover:bg-red-500/20 p-2.5 rounded-full transition-all group border border-white/10">
              <ArrowRightOnRectangleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b print:hidden sticky top-[72px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
          <div className="flex overflow-x-auto scrollbar-hide border-b md:border-b-0 md:border-l">
            <button 
              onClick={() => {setActiveTab('REGISTER'); setEditingId(null); setFormData(initialForm);}}
              className={`flex items-center gap-2 px-6 py-4 font-black border-b-4 transition-all whitespace-nowrap ${activeTab === 'REGISTER' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <PlusCircleIcon className="w-5 h-5" /> تسجيل لوحات
            </button>
            <button 
              onClick={() => setActiveTab('SEARCH')}
              className={`flex items-center gap-2 px-6 py-4 font-black border-b-4 transition-all whitespace-nowrap ${activeTab === 'SEARCH' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <ArchiveBoxIcon className="w-5 h-5" /> السجل العام ({records.length})
            </button>
          </div>
          
          <div className="flex overflow-x-auto scrollbar-hide bg-slate-50/50">
            <button 
              onClick={() => setActiveEntity('mukafaha')}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activeEntity === 'mukafaha' ? 'text-indigo-700 bg-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              قسم المكافحة
            </button>
            <button 
              onClick={() => setActiveEntity('bahth')}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activeEntity === 'bahth' ? 'text-indigo-700 bg-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              قسم البحث الجنائي
            </button>
            <button 
              onClick={() => setActiveEntity('mutabaa')}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activeEntity === 'mutabaa' ? 'text-indigo-700 bg-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              قسم المتابعة والخدمات
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 lg:p-10 print:p-0">
        <div className="mb-6 bg-indigo-950 text-white p-5 rounded-3xl shadow-xl print:hidden flex items-center justify-between border-r-8 border-indigo-500">
           <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-xl"><ArrowPathIcon className="w-5 h-5 text-indigo-400" /></div>
              <div>
                 <p className="text-sm font-black">نظام الأرشفة الرقمي</p>
                 <p className="text-[10px] opacity-60 font-bold">يتم التخزين محلياً - احرص على تصدير البيانات دورياً</p>
              </div>
           </div>
           <button onClick={handleExportData} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg">
              <ArrowDownTrayIcon className="w-4 h-4" /> تصدير نسخة الأرشيف
           </button>
        </div>

        {activeTab === 'REGISTER' ? (
          <div className="max-w-3xl mx-auto">
            {/* Form Section */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-800">
                  <DocumentPlusIcon className="w-8 h-8 text-indigo-600" />
                  <h2 className="text-xl font-black">{editingId ? 'تعديل السجل' : 'أرشفة لوحات جديدة'}</h2>
                </div>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-bounce">
                    <CheckCircleIcon className="w-5 h-5" /> تم الحفظ
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">القسم (الجدول)</label>
                  <div className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl font-black text-indigo-700">
                    {activeEntity === 'mukafaha' ? 'قسم المكافحة' : activeEntity === 'bahth' ? 'قسم البحث الجنائي' : 'قسم المتابعة والخدمات'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">رقم محضر الاستلام</label>
                  <input type="text" required value={formData.reportNumber || ''} onChange={e => setFormData({...formData, reportNumber: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="رقم المحضر" />
                </div>
                
                {/* Expanded Plate Number Field */}
                <div className="space-y-2 col-span-full">
                  <label className="text-xs font-black text-indigo-600 uppercase tracking-widest">رقم اللوحة (مركزي)</label>
                  <div className="relative group">
                    <IdentificationIcon className="w-8 h-8 absolute top-1/2 -translate-y-1/2 right-4 text-indigo-200 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                    <input 
                      type="number" 
                      required 
                      value={formData.plateNumber || ''} 
                      onChange={e => setFormData({...formData, plateNumber: e.target.value})} 
                      className="w-full p-6 pr-16 bg-indigo-50 border-2 border-indigo-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-black text-4xl text-indigo-900 placeholder:text-indigo-200" 
                      placeholder="00000" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">نوع المركبة</label>
                  <select value={formData.plateType || 'خصوصي'} onChange={e => setFormData({...formData, plateType: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold">
                    <option>خصوصي</option>
                    <option>أجرة</option>
                    <option>نقل</option>
                    <option>حكومي</option>
                    <option>دراجة نارية</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">العدد</label>
                  <input 
                    type="number" 
                    value={formData.quantity || ''} 
                    onChange={e => setFormData({...formData, quantity: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold" 
                    placeholder="العدد" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">رقم الفاصل</label>
                  <input type="number" required value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-black text-xl" placeholder="رقم الفاصل" />
                </div>

                {/* Expanded Date Fields */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">تاريخ الحجز/الاستلام</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.seizureDate || ''} 
                    onChange={e => setFormData({...formData, seizureDate: e.target.value})} 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-lg text-slate-700" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">تاريخ التوريد لإدارة المرور</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.trafficSupplyDate || ''} 
                    onChange={e => setFormData({...formData, trafficSupplyDate: e.target.value})} 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-lg text-slate-700" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">نوع السيارة (الموديل)</label>
                  <input 
                    type="text" 
                    value={formData.vehicleModel || ''} 
                    onChange={e => setFormData({...formData, vehicleModel: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" 
                    placeholder="مثلاً: تويوتا هايلوكس" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الجهة المورد منها اللوحة</label>
                  <select 
                    value={formData.supplyingEntity || (activeEntity === 'mukafaha' ? 'مكافحة' : activeEntity === 'bahth' ? 'بحث جنائي' : 'خدمات')} 
                    onChange={e => setFormData({...formData, supplyingEntity: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold"
                  >
                    <option value="مكافحة">مكافحة</option>
                    <option value="بحث جنائي">بحث جنائي</option>
                    <option value="خدمات">خدمات</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الأشياء المسحوبة مع الرقم</label>
                  <input 
                    type="text" 
                    value={formData.seizedItems || ''} 
                    onChange={e => setFormData({...formData, seizedItems: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" 
                    placeholder="مثلاً: رخصة، كرت، مفتاح" 
                  />
                </div>

                <div className="space-y-2 col-span-full">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الإجراءات المتخذة</label>
                  <textarea 
                    rows={4}
                    value={formData.actionsTaken || ''} 
                    onChange={e => setFormData({...formData, actionsTaken: e.target.value})} 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-lg text-slate-700" 
                    placeholder="اكتب الإجراءات المتخذة حيال هذه اللوحة..."
                  />
                </div>

                <div className="space-y-2 col-span-full">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ملاحظات إضافية</label>
                  <textarea 
                    rows={6}
                    value={formData.notes || ''} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-lg text-slate-700" 
                    placeholder="أي ملاحظات أخرى..."
                  />
                </div>

                <div className="col-span-full pt-6">
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                    {loading ? <ArrowPathIcon className="w-7 h-7 animate-spin" /> : editingId ? 'تعديل البيانات' : 'حفظ البيانات في الأرشيف'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Controls */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end print:hidden">
              <div className="lg:col-span-6">
                <label className="block text-xs font-black mb-3 pr-1 text-slate-500 uppercase tracking-widest">بحث شامل في الأرشيف</label>
                <div className="relative group">
                  <MagnifyingGlassIcon className="w-6 h-6 absolute top-4 right-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-4 pr-14 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold" placeholder="رقم اللوحة أو الفاصل..." />
                </div>
              </div>
              <div className="lg:col-span-6 flex flex-wrap gap-3 justify-end">
                <button 
                  onClick={loadAllRecords} 
                  className="bg-slate-50 text-slate-800 px-5 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-100 transition-all border-2 border-slate-200 text-sm"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  تحديث
                </button>
                <button 
                  onClick={handleGenerateSummary} 
                  disabled={isGeneratingSummary}
                  className="bg-slate-50 text-slate-800 px-5 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-100 transition-all border-2 border-slate-200 text-sm"
                >
                  {isGeneratingSummary ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5 text-indigo-600" />}
                  تحليل ذكي
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="bg-indigo-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all shadow-xl text-sm"
                >
                  <PrinterIcon className="w-5 h-5" /> طباعة الكشف
                </button>
              </div>
            </div>

            {/* AI Summary */}
            {aiSummary && (
              <div className="bg-white text-slate-800 p-8 rounded-3xl shadow-2xl border-r-8 border-indigo-600 relative overflow-hidden report-card">
                 <h3 className="text-lg font-black mb-4 flex items-center gap-3 text-indigo-600">
                    <SparklesIcon className="w-6 h-6" /> التقرير الإداري (Gemini AI)
                 </h3>
                 <p className="text-lg leading-relaxed font-medium whitespace-pre-wrap">
                   {aiSummary}
                 </p>
                 <button onClick={() => setAiSummary('')} className="mt-4 text-xs text-slate-400 font-bold hover:text-indigo-600 transition-colors no-print">× إغلاق التقرير</button>
              </div>
            )}

            {/* Table */}
            <div id="printable-archive" className="bg-white p-4 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 min-h-[500px]">
                            <div className="hidden print:block mb-4 text-center pdf-header">
                  <div className="mb-2 flex flex-col items-center gap-2">
                     <p className="font-black text-2xl">بسم الله الرحمن الرحيم</p>
                     <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Emblem_of_Yemen.svg/120px-Emblem_of_Yemen.svg.png" 
                        alt="شعار الجمهورية اليمنية" 
                        className="w-24 h-24 object-contain"
                        referrerPolicy="no-referrer"
                     />
                  </div>
                  <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-2">
                     <div className="text-right space-y-1 w-1/3">
                        <p className="font-black text-xl">الجمهورية اليمنية</p>
                        <p className="font-bold text-lg">وزارة الداخلية</p>
                        <p className="font-bold text-lg">إدارة مرور محافظة تعز</p>
                     </div>
                     
                     <div className="w-1/3 flex flex-col items-center justify-center">
                        {/* Center space reserved or for additional title info */}
                     </div>

                     <div className="w-1/3 flex justify-end">
                        <div className="w-28 h-28 border-4 border-slate-900 rounded-3xl flex items-center justify-center font-black text-xs text-center p-2 leading-tight">
                           أرشيف<br/>مرور<br/>تعز
                        </div>
                     </div>
                  </div>
                 
                 <div className="mb-4">
                    <h2 className="text-3xl font-black mb-1 underline decoration-double underline-offset-8">
                      كشف بيانات اللوحات - {activeEntity === 'mukafaha' ? 'قسم المكافحة' : activeEntity === 'bahth' ? 'قسم البحث الجنائي' : 'قسم المتابعة والخدمات'}
                    </h2>
                    <p className="text-sm font-bold opacity-60">تاريخ الكشف: {new Date().toLocaleDateString('ar-YE')}</p>
                 </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-indigo-900 text-white print:bg-slate-100 print:text-black">
                      <th className="p-2 border-b font-black text-[8px] text-center w-[3%]">م</th>
                      <th className="p-2 border-b font-black text-[8px] w-[7%]">رقم المحضر</th>
                      <th className="p-2 border-b font-black text-[8px] w-[8%]">رقم اللوحة</th>
                      <th className="p-2 border-b font-black text-[8px] text-center w-[6%]">رقم الفاصل</th>
                      <th className="p-2 border-b font-black text-[8px] w-[7%]">نوع اللوحة</th>
                      <th className="p-2 border-b font-black text-[8px] text-center w-[4%]">العدد</th>
                      <th className="p-2 border-b font-black text-[8px] text-center w-[8%]">تاريخ الحجز</th>
                      <th className="p-2 border-b font-black text-[8px] text-center w-[8%]">تاريخ التوريد</th>
                      <th className="p-2 border-b font-black text-[8px] w-[8%]">نوع السيارة</th>
                      <th className="p-2 border-b font-black text-[8px] w-[8%]">الجهة الموردة</th>
                      <th className="p-2 border-b font-black text-[8px] w-[8%]">الأشياء المسحوبة</th>
                      <th className="p-2 border-b font-black text-[8px] w-[20%]">الإجراءات المتخذة</th>
                      <th className="p-2 border-b font-black text-[8px] w-[10%]">ملاحظات إضافية</th>
                      <th className="p-2 border-b font-black text-[8px] no-print text-center w-[5%]">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRecords.map((rec, idx) => {
                      const isDelivered = rec.actionsTaken?.includes('تم تسليمها لصاحبها');
                      return (
                        <tr key={rec.id} className={`${isDelivered ? 'bg-orange-500 text-white' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50') + ' hover:bg-indigo-50/30'} transition-colors`}>
                          <td className={`p-4 text-center font-black border print:border-slate-200 ${isDelivered ? 'bg-orange-600/20' : 'bg-slate-100/50'} print:bg-transparent text-xs`}>{idx + 1}</td>
                          <td className={`p-4 font-bold ${isDelivered ? 'text-white' : 'text-slate-600'} border print:border-slate-200 text-xs`}>{rec.reportNumber}</td>
                          <td className="p-4 border print:border-slate-200 font-black text-xl tracking-tighter">{rec.plateNumber}</td>
                          <td className="p-4 text-center border print:border-slate-200">
                             <span className={`${isDelivered ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'} px-2 py-0.5 rounded-lg font-black text-base print:bg-transparent print:text-black print:p-0`}>
                                {rec.category}
                             </span>
                          </td>
                          <td className={`p-4 font-bold ${isDelivered ? 'text-white' : 'text-slate-600'} border print:border-slate-200 text-xs`}>{rec.plateType}</td>
                          <td className="p-4 text-center font-bold border print:border-slate-200 text-xs">{rec.quantity}</td>
                          <td className="p-4 text-center font-bold border print:border-slate-200 text-xs">{rec.seizureDate}</td>
                          <td className="p-4 text-center font-bold border print:border-slate-200 text-xs">{rec.trafficSupplyDate}</td>
                          <td className={`p-4 font-bold ${isDelivered ? 'text-white' : 'text-slate-600'} border print:border-slate-200 text-xs`}>{rec.vehicleModel}</td>
                          <td className={`p-4 font-bold ${isDelivered ? 'text-white' : 'text-indigo-600'} border print:border-slate-200 text-xs`}>{rec.supplyingEntity}</td>
                          <td className={`p-4 font-bold ${isDelivered ? 'text-white' : 'text-slate-600'} border print:border-slate-200 text-xs`}>{rec.seizedItems}</td>
                          <td className="p-4 text-[10px] font-medium border print:border-slate-200 break-words whitespace-pre-wrap leading-relaxed" title={rec.actionsTaken}>{rec.actionsTaken}</td>
                          <td className="p-4 text-[10px] font-medium border print:border-slate-200">{rec.notes}</td>
                          <td className="p-4 no-print border text-center">
                            <div className="flex justify-center gap-1">
                              <button type="button" onClick={() => onEdit(rec)} disabled={loading} className={`p-2 ${isDelivered ? 'text-white hover:bg-white/20' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-colors cursor-pointer disabled:opacity-50`}><PencilSquareIcon className="w-5 h-5" /></button>
                              <button type="button" onClick={() => onDelete(rec.id)} disabled={loading} className={`p-2 ${isDelivered ? 'text-white hover:bg-white/20' : 'text-red-500 hover:bg-red-50'} rounded-lg transition-colors cursor-pointer disabled:opacity-50`}><TrashIcon className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredRecords.length === 0 && (
                  <div className="p-20 text-center text-slate-400 font-black flex flex-col items-center gap-4">
                     <IdentificationIcon className="w-16 h-16 opacity-10" />
                     لا توجد سجلات مطابقة لعملية البحث
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
