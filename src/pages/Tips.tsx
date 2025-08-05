import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTips } from '@/hooks/useTips';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, Lightbulb, Crown, BookOpen, Star, Filter } from 'lucide-react';
import TipSubmissionForm from '@/components/forms/TipSubmissionForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- צבעים לקטגוריות (ל־Night Mode)
const categoryNightColors: Record<string, string> = {
  לימודים: 'bg-gradient-to-r from-purple-700 to-purple-500 text-purple-100 border-purple-600 shadow-purple',
  מבחנים: 'bg-gradient-to-r from-blue-800 to-blue-500 text-blue-100 border-blue-600 shadow-blue',
  טיפים: 'bg-gradient-to-r from-yellow-500 to-orange-400 text-yellow-100 border-yellow-500 shadow-yellow',
  קריירה: 'bg-gradient-to-r from-green-700 to-green-400 text-green-100 border-green-600 shadow-green',
  כללי: 'bg-gradient-to-r from-zinc-700 to-zinc-500 text-zinc-100 border-zinc-600 shadow-zinc',
};

const Tips = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { data: tips = [], isLoading } = useTips();
  const [selectedTip, setSelectedTip] = useState<any>(null);
  const [showTipForm, setShowTipForm] = useState(false);

  // --- סינון קטגוריות
  const categories = Array.from(new Set(tips.map(t => t.category || 'כללי')));
  const [filter, setFilter] = useState('כל הקטגוריות');
  const tipsToShow = filter === 'כל הקטגוריות' ? tips : tips.filter(t => t.category === filter);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden font-assistant bg-gradient-to-br from-[#151628] via-[#191d2b] to-[#181921] dark" dir={dir}>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* רקעים דינמיים ו-Neon Blobs */}
        <div className="absolute top-32 left-8 w-60 h-60 rounded-full bg-gradient-to-br from-blue-700 via-violet-600 to-purple-600 opacity-30 blur-3xl animate-blob"></div>
        <div className="absolute bottom-24 right-10 w-52 h-52 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 opacity-20 blur-3xl animate-blob animation-delay-3000"></div>
        <div className="absolute top-1/2 left-1/2 w-36 h-36 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-400 opacity-25 blur-2xl animate-blob animation-delay-1000"></div>
        <style>{`
          @keyframes blob { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.12) translate(30px,20px);} }
          .animate-blob { animation: blob 14s infinite cubic-bezier(.8,0,.2,1); }
          .animation-delay-1000 { animation-delay: 1s; }
          .animation-delay-3000 { animation-delay: 3s; }
        `}</style>
      </div>

      <Header />

      <section className="relative z-10">
        <div className="container mx-auto px-4 pt-8 pb-3">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              חזור לדף הבית
            </Button>
          </div>
          <div className="mx-auto text-center max-w-2xl rounded-3xl
            bg-gradient-to-br from-[#241650dd] via-[#2b1b5fd6] to-[#41208ae0]
            shadow-[0_0_36px_4px_#613fff44,0_6px_32px_0_#2a1c4d50]
            py-8 px-7 mb-2 backdrop-blur-xl border border-violet-800/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="w-7 h-7 text-yellow-400 drop-shadow-neon" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-neon">
                טיפים חכמים להצלחה ✨
              </h1>
            </div>
            <p className="text-base md:text-lg text-violet-100">
              רעיונות, כלים ותובנות שיעזרו לך לצלוח את הלימודים <strong className="font-semibold text-yellow-300">בדרך חכמה</strong> ונעימה.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 pb-14 pt-0 relative z-10">
        {/* פילטר קטגוריה */}
        <div className="flex items-center gap-3 mt-3 mb-7">
          <Filter className="w-5 h-5 text-zinc-400" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded-lg px-3 py-1 border border-zinc-700 bg-[#232341] text-violet-100 shadow focus:ring-2 focus:ring-violet-400 font-bold"
            style={{ minWidth: 120 }}
          >
            <option value="כל הקטגוריות">כל הקטגוריות</option>
            {categories.map(cat =>
              <option key={cat} value={cat}>{cat}</option>
            )}
          </select>
        </div>

        {/* מצב טעינה */}
        {isLoading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-4 text-zinc-300 font-bold">טוען טיפים...</p>
          </div>
        )}

        {/* Grid טיפים */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tipsToShow.map((tip, index) => (
            <Card
              key={tip.id}
              className={`
                group rounded-2xl 
                shadow-[0_0_16px_3px_#4e3dbe50,0_4px_24px_#18193d99]
                border border-violet-800/40
                bg-gradient-to-br from-[#24214aee] via-[#23234aee] to-[#28245cfa]
                relative overflow-hidden transition-all duration-200 cursor-pointer
                hover:scale-[1.025] hover:-translate-y-1 hover:z-10
                hover:shadow-[0_0_46px_8px_#6b48ff7a,0_6px_36px_#332083dd]
                animate-fade-in
              `}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#7c5aff] via-[#e3a90d77] to-[#0ea5e9aa] opacity-40 blur-xl"></div>
              </div>
              <CardHeader className="pt-7 pb-3">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2
                      ${tip.isSponsored
                        ? 'bg-yellow-400 border-yellow-300'
                        : 'bg-blue-600 border-blue-400'
                      }
                      drop-shadow-neon
                    `}>
                      {tip.isSponsored ? (
                        <Crown className="w-5 h-5 text-white drop-shadow-neon" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-yellow-200 drop-shadow-neon" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold truncate text-violet-100 drop-shadow-neon">{tip.title}</CardTitle>
                  </div>
                  {/* קטגוריה */}
                  <Badge className={`px-2 py-0.5 text-xs rounded-full border ${categoryNightColors[tip.category] || categoryNightColors['כללי']} drop-shadow-neon`}>
                    {tip.category || 'כללי'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-7 pt-0">
                <div className="text-violet-100/90 line-clamp-4 mb-4 font-medium">{tip.content}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 drop-shadow-neon" />
                    <span className="text-xs text-zinc-300 font-bold">דירוג: {tip.rating}/5</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTip(tip)}
                        className="group-hover:bg-[#282961] group-hover:border-violet-400 font-bold px-4 py-1 rounded-full shadow drop-shadow-neon text-violet-200 border-violet-500 border-2"
                      >
                        קרא עוד
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-2xl bg-[#1b1835f8] shadow-2xl border border-violet-700">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-violet-100">
                          {tip.isSponsored ? (
                            <Crown className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Lightbulb className="w-5 h-5 text-yellow-300" />
                          )}
                          {tip.title}
                          {tip.isSponsored && (
                            <Badge className="bg-yellow-500 text-white ml-2 rounded-full drop-shadow-neon">ממומן</Badge>
                          )}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-5">
                        <div className="whitespace-pre-wrap text-violet-100/90 leading-relaxed text-base">
                          {tip.content}
                        </div>
                        <div className="mt-7 pt-4 border-t border-violet-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-violet-100 font-bold">
                                דירוג: {tip.rating}/5
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-violet-200">
                              <BookOpen className="w-4 h-4" />
                              <span>קטגוריה: {tip.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tipsToShow.length === 0 && !isLoading && (
          <Card className="p-10 text-center bg-gradient-to-br from-[#232245e6] via-[#3e3666e8] to-[#262647] shadow-2xl rounded-2xl border border-violet-800/40 mt-10">
            <Lightbulb className="w-16 h-16 mx-auto text-yellow-400 mb-4 drop-shadow-neon" />
            <h3 className="text-xl font-bold mb-2 text-violet-100 drop-shadow-neon">אין טיפים זמינים</h3>
            <p className="text-zinc-300">חזור מאוחר יותר לטיפים חדשים ומועילים</p>
          </Card>
        )}

        {/* CTA - שתף טיפ */}
        <Card className="mt-16 bg-gradient-to-r from-violet-700 via-purple-500 to-indigo-700 text-white overflow-hidden rounded-xl shadow-xl relative border-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-violet-700/30 pointer-events-none"></div>
          <CardContent className="p-11 text-center relative z-10">
            <h2 className="text-xl font-bold mb-3 text-white drop-shadow-neon">יש לך טיפ שיכול לעזור לאחרים?</h2>
            <p className="text-base mb-6 opacity-95">
              שתף את הטיפים שלך וקבל הכרה מקהילת הסטודנטים
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-indigo-700 hover:bg-violet-100 rounded-xl font-bold shadow-lg px-7 py-2.5 text-base border-2 border-violet-400 hover:scale-105 transition drop-shadow-neon"
              onClick={() => setShowTipForm(true)}
            >
              שתף טיפ חדש
            </Button>
          </CardContent>
        </Card>
      </main>

      <TipSubmissionForm isOpen={showTipForm} onClose={() => setShowTipForm(false)} />
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap');
        .font-assistant { font-family: 'Assistant', Arial, sans-serif !important; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(26px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.5s cubic-bezier(.38,1.15,.6,1.01) forwards;
        }
        .drop-shadow-neon {
          filter: drop-shadow(0 0 7px #8f7cff) drop-shadow(0 0 4px #0003);
        }
      `}</style>
    </div>
  );
};

export default Tips;
