
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Medication, MedicationPeriod, DailyLog } from './types';
import Button from './components/Button';
import { analyzeMedicationImage } from './services/geminiService';

const PERIOD_MAP: Record<MedicationPeriod, { label: string, emoji: string, time: string, color: string, border: string }> = {
  morning: { label: 'เช้า', emoji: '☀️', time: '08:00', color: 'text-orange-600 bg-orange-50', border: 'border-orange-400' },
  midday: { label: 'กลางวัน', emoji: '☁️', time: '12:00', color: 'text-blue-600 bg-blue-50', border: 'border-blue-400' },
  evening: { label: 'เย็น', emoji: '⛅', time: '18:00', color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-400' },
  bedtime: { label: 'ก่อนนอน', emoji: '🌙', time: '21:00', color: 'text-purple-600 bg-purple-50', border: 'border-purple-400' }
};

const DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const getTodayString = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog>({ date: getTodayString(), taken: [] });

  // Load data
  useEffect(() => {
    const savedMeds = localStorage.getItem('med_reminders_v6');
    if (savedMeds) setMedications(JSON.parse(savedMeds));

    const savedLog = localStorage.getItem('med_log_v6');
    const today = getTodayString();
    if (savedLog) {
      const log = JSON.parse(savedLog) as DailyLog;
      if (log.date === today) {
        setDailyLog(log);
      } else {
        const newLog = { date: today, taken: [] };
        setDailyLog(newLog);
        localStorage.setItem('med_log_v6', JSON.stringify(newLog));
      }
    }
  }, []);

  const saveMedications = useCallback((newMeds: Medication[]) => {
    setMedications(newMeds);
    localStorage.setItem('med_reminders_v6', JSON.stringify(newMeds));
  }, []);

  const updateDailyLog = useCallback((updatedLog: DailyLog) => {
    setDailyLog(updatedLog);
    localStorage.setItem('med_log_v6', JSON.stringify(updatedLog));
  }, []);

  const addMedication = (med: Medication) => {
    saveMedications([...medications, med]);
    setCurrentView(View.DASHBOARD);
  };

  const removeMedication = (id: string) => {
    if (confirm("ต้องการลบรายการยานี้ใช่ไหม?")) {
      saveMedications(medications.filter(m => m.id !== id));
    }
  };

  const toggleMedTaken = (id: string) => {
    const med = medications.find(m => m.id === id);
    const isTaken = dailyLog.taken.includes(id);
    const updatedTaken = isTaken 
      ? dailyLog.taken.filter(mid => mid !== id) 
      : [...dailyLog.taken, id];
    
    updateDailyLog({ ...dailyLog, taken: updatedTaken });
    
    if (!isTaken && med) {
      let message = "เก่งมากครับ! ทานยาเรียบร้อยแล้ว";
      
      if (med.syncRelative && med.relativeContact) {
        console.log(`[SIMULATION] Notification sent to ${med.relativeContact}: "คุณพ่อ/คุณแม่ ทานยา ${med.name} จำนวน ${med.pillsPerTime} เม็ด แล้วครับ/ค่ะ"`);
        message += `\n\n📢 ส่งข้อความแจ้งเตือนไปที่ ${med.relativeContact} ให้ลูกหลานทราบแล้วครับ`;
      }
      
      alert(message);
    }
  };

  const showNav = currentView !== View.HOME && currentView !== View.LOGIN;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans select-none pb-24 relative">
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === View.HOME && <HomeView onStart={() => setCurrentView(View.LOGIN)} />}
        {currentView === View.LOGIN && <LoginView onBack={() => setCurrentView(View.HOME)} onSuccess={() => setCurrentView(View.DASHBOARD)} />}
        {currentView === View.DASHBOARD && (
          <DashboardView 
            medications={medications} 
            dailyLog={dailyLog}
            onToggleTaken={toggleMedTaken}
          />
        )}
        {currentView === View.ADD_MED && (
          <AddMedView 
            onCancel={() => setCurrentView(View.DASHBOARD)} 
            onSave={addMedication} 
          />
        )}
        {currentView === View.CONTACT && <ContactView />}
      </div>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-100 flex justify-around items-center h-24 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] z-50 max-w-md mx-auto">
          <button 
            onClick={() => setCurrentView(View.DASHBOARD)} 
            className={`flex flex-col items-center flex-1 py-2 transition-all ${currentView === View.DASHBOARD ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <span className="text-3xl mb-1">📋</span>
            <span className={`text-sm font-black ${currentView === View.DASHBOARD ? 'text-blue-600' : 'text-slate-400'}`}>รายการยา</span>
            {currentView === View.DASHBOARD && <div className="w-8 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
          
          <button 
            onClick={() => setCurrentView(View.ADD_MED)} 
            className={`flex flex-col items-center flex-1 py-2 transition-all ${currentView === View.ADD_MED ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <span className="text-3xl mb-1">➕</span>
            <span className={`text-sm font-black ${currentView === View.ADD_MED ? 'text-blue-600' : 'text-slate-400'}`}>เพิ่มยา</span>
            {currentView === View.ADD_MED && <div className="w-8 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
          
          <button 
            onClick={() => setCurrentView(View.CONTACT)} 
            className={`flex flex-col items-center flex-1 py-2 transition-all ${currentView === View.CONTACT ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <span className="text-3xl mb-1">📞</span>
            <span className={`text-sm font-black ${currentView === View.CONTACT ? 'text-blue-600' : 'text-slate-400'}`}>ติดต่อ</span>
            {currentView === View.CONTACT && <div className="w-8 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
        </nav>
      )}
    </div>
  );
};

const HomeView: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
    <div className="bg-white p-12 rounded-[60px] shadow-2xl w-full border-b-[16px] border-blue-500">
      <div className="text-[100px] mb-8">💊</div>
      <h1 className="text-5xl font-black text-blue-600 mb-6 leading-tight">ช่วยจำทานยา</h1>
      <p className="text-slate-500 mb-12 text-2xl leading-relaxed font-medium">
        ทานยาครบ ตรงเวลา<br />
        <span className="text-green-500 font-bold underline decoration-4 underline-offset-8">สุขภาพแข็งแรง</span>
      </p>
      <Button variant="primary" size="xl" onClick={onStart} className="py-8 rounded-[35px] shadow-blue-200 shadow-2xl text-3xl">
        เริ่มต้นใช้งาน
      </Button>
    </div>
  </div>
);

const LoginView: React.FC<{ onBack: () => void; onSuccess: () => void }> = ({ onBack, onSuccess }) => (
  <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-bottom-20 duration-500">
    <button onClick={onBack} className="text-blue-500 mb-12 flex items-center text-2xl font-black">
      <span className="mr-3">←</span> กลับหน้าแรก
    </button>
    <div className="bg-white p-10 rounded-[50px] shadow-xl border-t-8 border-blue-500">
      <h2 className="text-4xl font-black mb-10 text-slate-800">เข้าสู่ระบบ</h2>
      <div className="space-y-8">
        <div>
          <label className="block text-slate-400 text-lg mb-3 ml-2 font-bold italic">เบอร์โทรศัพท์</label>
          <input 
            type="tel" 
            placeholder="0XX-XXX-XXXX" 
            className="w-full p-6 bg-slate-50 border-4 border-slate-50 rounded-3xl focus:border-blue-500 outline-none text-2xl font-bold"
          />
        </div>
        <Button variant="primary" size="xl" onClick={onSuccess} className="py-7 rounded-[30px] shadow-xl">
          ตกลง
        </Button>
      </div>
    </div>
  </div>
);

const DashboardView: React.FC<{ 
  medications: Medication[]; 
  dailyLog: DailyLog;
  onToggleTaken: (id: string) => void;
}> = ({ medications, dailyLog, onToggleTaken }) => {
  const currentDay = new Date().getDay();

  const sortedTodayMeds = useMemo(() => {
    // Filter by day first
    return [...medications]
      .filter(m => m.repeatDays.includes(currentDay))
      .sort((a, b) => {
        const order: MedicationPeriod[] = ['morning', 'midday', 'evening', 'bedtime'];
        const aMin = Math.min(...a.periods.map(p => order.indexOf(p)));
        const bMin = Math.min(...b.periods.map(p => order.indexOf(p)));
        return aMin - bMin;
      });
  }, [medications, currentDay]);

  const thaiDate = useMemo(() => {
    const now = new Date();
    return `วัน${DAYS_FULL[now.getDay()]}ที่ ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543}`;
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">ยาของวันนี้</h2>
          <p className="text-blue-600 font-bold text-xl">{thaiDate}</p>
        </div>
        <div className="bg-blue-100 text-blue-600 px-6 py-2 rounded-full font-black text-xl">
          {dailyLog.taken.filter(id => sortedTodayMeds.some(m => m.id === id)).length}/{sortedTodayMeds.length}
        </div>
      </div>

      <div className="space-y-6">
        {sortedTodayMeds.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[50px] border-4 border-dashed border-slate-200">
            <div className="text-8xl mb-6 opacity-20">📭</div>
            <p className="text-slate-400 text-2xl font-black italic tracking-wide">วันนี้ไม่มีรายการยาครับ</p>
          </div>
        ) : (
          sortedTodayMeds.map(med => {
            const isTaken = dailyLog.taken.includes(med.id);
            return (
              <div 
                key={med.id} 
                onClick={() => onToggleTaken(med.id)}
                className={`bg-white p-6 rounded-[45px] shadow-md border-l-[15px] flex items-center gap-6 transition-all active:scale-95 cursor-pointer ${isTaken ? 'opacity-40 border-green-500' : `border-blue-500`}`}
              >
                <div className="relative">
                  {med.image ? (
                    <img src={med.image} className="w-24 h-24 object-cover rounded-[30px] border-2 border-slate-100 shadow-sm" alt={med.name} />
                  ) : (
                    <div className="w-24 h-24 bg-blue-50 rounded-[30px] flex items-center justify-center text-5xl">💊</div>
                  )}
                  {isTaken && (
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-xl border-4 border-white font-bold">✓</div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className={`text-2xl font-black text-slate-800 truncate ${isTaken ? 'line-through' : ''}`}>{med.name}</h3>
                  <p className="text-blue-600 font-bold text-lg">ทานครั้งละ {med.pillsPerTime} เม็ด</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {med.periods.map(p => (
                      <span key={p} className={`px-4 py-1.5 rounded-2xl text-sm font-black border-2 ${PERIOD_MAP[p].color} border-current opacity-90`}>
                        {PERIOD_MAP[p].emoji} {PERIOD_MAP[p].label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${isTaken ? 'bg-green-500 border-green-600' : 'bg-slate-50 border-slate-200'}`}>
                  {isTaken && <span className="text-white text-3xl font-black">✓</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 p-8 bg-white/50 rounded-[40px] border-2 border-dashed border-slate-300 text-center">
        <p className="text-slate-400 text-xl font-bold italic">ข้อมูลการทานยาจะถูกส่งให้ลูกหลานอัตโนมัติ 👨‍👩‍👧‍👦</p>
      </div>
    </div>
  );
};

const AddMedView: React.FC<{ onCancel: () => void; onSave: (med: Medication) => void }> = ({ onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [pillsPerTime, setPillsPerTime] = useState<number>(1);
  const [selectedPeriods, setSelectedPeriods] = useState<MedicationPeriod[]>([]);
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncRelative, setSyncRelative] = useState(true);
  const [relativeContact, setRelativeContact] = useState('');

  const togglePeriod = (p: MedicationPeriod) => {
    setSelectedPeriods(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  const toggleDay = (day: number) => {
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setIsAnalyzing(true);
      try {
        const cleanedBase64 = base64String.split(',')[1];
        const result = await analyzeMedicationImage(cleanedBase64);
        if (result) {
          setName(result.name || '');
          setDosage(result.dosage || '');
          if (result.periods) setSelectedPeriods(result.periods as MedicationPeriod[]);
          
          const match = (result.dosage || "").match(/(\d+(\.\d+)?)/);
          if (match) setPillsPerTime(parseFloat(match[0]));
        }
      } catch (err) {
        console.error("AI Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name) { alert("กรุณาระบุชื่อยาด้วยครับ"); return; }
    if (selectedPeriods.length === 0) { alert("กรุณาเลือกเวลาทานยาด้วยครับ"); return; }
    if (repeatDays.length === 0) { alert("กรุณาเลือกวันที่จะทานยาด้วยครับ"); return; }
    if (syncRelative && !relativeContact) { alert("กรุณาระบุเบอร์โทรลูกหลานสำหรับแจ้งเตือนครับ"); return; }
    
    onSave({
      id: Date.now().toString(),
      name,
      dosage,
      pillsPerTime,
      image: image || undefined,
      periods: selectedPeriods,
      repeatDays: repeatDays,
      reminders: selectedPeriods.map(p => PERIOD_MAP[p].time),
      syncRelative: syncRelative,
      syncDoctor: true,
      relativeContact: relativeContact
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right-10 pb-12">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-slate-800 italic">➕ เพิ่มยาใหม่</h2>
        <Button variant="danger" size="md" onClick={onCancel} className="px-6 rounded-2xl">ออก</Button>
      </div>

      <div className="space-y-10">
        {/* Step 1: Image & Name */}
        <section className="bg-white p-8 rounded-[50px] shadow-sm border-2 border-blue-100">
          <label className="block text-blue-800 text-2xl font-black mb-6">1. ข้อมูลยา</label>
          <div 
            className="group relative border-4 border-dashed border-blue-200 rounded-[40px] p-12 text-center bg-blue-50 cursor-pointer overflow-hidden aspect-video flex flex-col items-center justify-center transition-all hover:bg-blue-100 shadow-inner mb-8"
            onClick={() => document.getElementById('cameraInput')?.click()}
          >
            {image ? (
              <>
                <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="relative z-10 font-black text-blue-700 bg-white/95 px-8 py-4 rounded-[25px] shadow-2xl text-2xl border-4 border-blue-100">📸 เปลี่ยนรูป</div>
              </>
            ) : (
              <>
                <div className="text-[100px] mb-4">📸</div>
                <p className="text-blue-600 font-black text-3xl">กดถ่ายรูปยา</p>
                <p className="text-blue-400 font-bold mt-2 italic text-lg opacity-80">AI จะช่วยอ่านชื่อยาให้</p>
              </>
            )}
            <input type="file" id="cameraInput" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <input 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isAnalyzing ? "กำลังประมวลผล..." : "ระบุชื่อยาที่นี่"} 
            className={`w-full p-7 bg-slate-50 rounded-[35px] border-4 text-3xl font-black outline-none transition-all mb-6 ${isAnalyzing ? 'border-yellow-300 animate-pulse' : 'border-slate-100 focus:border-blue-500'}`} 
          />

          <div className="bg-blue-50 p-6 rounded-[35px] border-2 border-blue-100">
            <label className="block text-blue-800 text-xl font-bold mb-4">ทานมื้อละกี่เม็ด?</label>
            <div className="flex items-center justify-between gap-6">
              <button 
                onClick={() => setPillsPerTime(Math.max(0.5, pillsPerTime - 0.5))}
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl font-black text-blue-600 shadow-md active:scale-90 border-2 border-blue-100"
              >-</button>
              <div className="flex-1 text-center">
                <span className="text-5xl font-black text-blue-800">{pillsPerTime}</span>
                <span className="text-2xl font-bold text-slate-500 ml-3">เม็ด</span>
              </div>
              <button 
                onClick={() => setPillsPerTime(pillsPerTime + 0.5)}
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl font-black text-blue-600 shadow-md active:scale-90 border-2 border-blue-100"
              >+</button>
            </div>
          </div>
        </section>

        {/* Step 2: Scheduling */}
        <section className="bg-white p-8 rounded-[50px] shadow-sm border-2 border-orange-100">
          <label className="block text-orange-800 text-2xl font-black mb-8">2. ทานตอนไหนบ้าง?</label>
          
          <div className="mb-8">
            <label className="block text-slate-400 font-bold mb-4 ml-2">ทานซ้ำทุกวันไหนบ้าง?</label>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`py-4 rounded-2xl border-2 font-black text-xl transition-all ${
                    repeatDays.includes(day)
                      ? 'bg-blue-600 border-blue-800 text-white shadow-md'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  } ${(day === 0 || day === 6) && !repeatDays.includes(day) ? 'text-red-300' : (day === 0 || day === 6) ? 'text-white bg-red-500 border-red-700' : ''}`}
                >
                  {DAYS_SHORT[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(PERIOD_MAP) as MedicationPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => togglePeriod(p)}
                className={`p-8 rounded-[40px] border-4 text-center transition-all flex flex-col items-center gap-4 ${
                  selectedPeriods.includes(p) 
                  ? 'bg-blue-600 border-blue-800 text-white shadow-xl scale-105' 
                  : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}
              >
                <span className="text-6xl">{PERIOD_MAP[p].emoji}</span>
                <span className="text-2xl font-black">{PERIOD_MAP[p].label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Notification Setting */}
        <section className="bg-white p-8 rounded-[50px] shadow-sm border-2 border-green-100">
          <label className="block text-green-800 text-2xl font-black mb-6">3. ตั้งค่าแจ้งเตือนหลาน</label>
          <div className="space-y-6">
            <label className="flex items-center gap-4 cursor-pointer p-6 bg-green-50 rounded-[35px] border-4 border-green-100 shadow-sm active:scale-95 transition-transform">
              <input 
                type="checkbox" 
                checked={syncRelative} 
                onChange={(e) => setSyncRelative(e.target.checked)}
                className="w-12 h-12 accent-green-600 rounded-xl"
              />
              <span className="text-2xl font-black text-slate-700">แจ้งเตือนหลานเมื่อทานยา</span>
            </label>
            
            {syncRelative && (
              <div className="animate-in slide-in-from-top-4">
                <p className="text-slate-400 font-bold mb-2 ml-4 italic">เบอร์โทรศัพท์ลูกหลาน</p>
                <input 
                  type="tel"
                  value={relativeContact}
                  onChange={(e) => setRelativeContact(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full p-7 bg-slate-50 border-4 border-slate-100 rounded-[35px] text-3xl font-black outline-none focus:border-green-500 shadow-inner"
                />
              </div>
            )}
          </div>
        </section>

        <Button variant="secondary" size="xl" onClick={handleSave} className="py-10 rounded-[45px] text-4xl shadow-green-200 shadow-2xl mb-12 border-b-[10px] border-green-800 active:border-b-0 active:translate-y-2">
          กดบันทึกยา
        </Button>
      </div>
    </div>
  );
};

const ContactView: React.FC = () => (
  <div className="flex-1 flex flex-col p-8 overflow-y-auto animate-in slide-in-from-left-10">
    <h2 className="text-4xl font-black text-slate-800 mb-12 tracking-tight">📞 ติดต่อ</h2>
    
    <div className="space-y-8">
      <a href="tel:0812345678" className="block bg-white p-8 rounded-[45px] shadow-xl flex items-center justify-between border-l-[15px] border-green-500 active:scale-95 transition-transform">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center text-5xl">👧</div>
          <div>
            <p className="text-slate-400 font-bold text-xl mb-1">ลูกหลาน (คุณเอ)</p>
            <p className="text-3xl font-black text-slate-800">081-234-5678</p>
          </div>
        </div>
        <span className="text-5xl animate-bounce">📞</span>
      </a>

      <a href="tel:1669" className="block bg-red-50 p-10 rounded-[45px] shadow-xl flex items-center justify-between border-l-[15px] border-red-500 active:scale-95 transition-transform border-2 border-red-100">
        <div>
          <p className="text-red-700 font-black text-4xl mb-2">ฉุกเฉิน (1669)</p>
          <p className="text-red-500 text-2xl font-bold">🚑 เรียกรถพยาบาลทันที</p>
        </div>
        <span className="text-7xl">🆘</span>
      </a>
      
      <div className="bg-white p-10 rounded-[45px] border-4 border-dashed border-slate-200 text-center opacity-60">
        <p className="text-slate-400 text-2xl font-black">🏥 โรงพยาบาลใกล้บ้าน</p>
        <p className="text-slate-300 text-xl font-bold mt-2">กำลังอัปเดตข้อมูล...</p>
      </div>
    </div>
  </div>
);

export default App;
