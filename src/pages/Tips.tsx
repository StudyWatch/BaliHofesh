
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTips } from '@/hooks/useTips';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, Lightbulb, Crown, BookOpen, Star } from 'lucide-react';
import TipSubmissionForm from '@/components/forms/TipSubmissionForm';

const Tips = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { data: tips = [], isLoading } = useTips();
  const [selectedTip, setSelectedTip] = useState<any>(null);
  const [showTipForm, setShowTipForm] = useState(false);

  return (
    <>
      <div 
        className="min-h-screen relative overflow-hidden" 
        dir={dir}
        style={{
          background: `
            linear-gradient(-45deg, #ff9a56, #ffad56, #ffc56b, #ffd54f, #fff176, #aed581),
            linear-gradient(45deg, rgba(255, 154, 86, 0.1), rgba(255, 173, 86, 0.1), rgba(255, 197, 107, 0.1))
          `,
          backgroundSize: '400% 400%, 100% 100%',
          animation: 'gradientShift 12s ease infinite'
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/6 right-1/6 w-40 h-40 bg-yellow-200/20 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-1/4 left-1/6 w-28 h-28 bg-orange-200/20 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 right-1/2 w-20 h-20 bg-red-200/20 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
        </div>

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border-b relative z-10">
          <div className="container mx-auto px-4 py-6">
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
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  איך לעבור את זה בשלום ✨
                </span>
              </h1>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                טיפים, טריקים ואסטרategיות להצלחה בלימודים ובבחינות
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">טוען טיפים...</p>
            </div>
          )}

          {/* Tips Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <Card 
                key={tip.id} 
                className={`hover:shadow-xl transition-all duration-300 cursor-pointer animate-fade-in ${
                  tip.isSponsored 
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300' 
                    : 'bg-white/80 backdrop-blur-sm'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tip.isSponsored ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}>
                        {tip.isSponsored ? (
                          <Crown className="w-4 h-4 text-white" />
                        ) : (
                          <Lightbulb className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {tip.title}
                      </CardTitle>
                    </div>
                    {tip.isSponsored && (
                      <Badge className="bg-yellow-500 text-white">
                        ممومן
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 line-clamp-3 mb-4">
                    {tip.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        דירוג: {tip.rating}/5
                      </span>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTip(tip)}
                          className="hover:bg-blue-50"
                        >
                          קרא עוד
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-50">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {tip.isSponsored ? (
                              <Crown className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <Lightbulb className="w-5 h-5 text-blue-500" />
                            )}
                            {tip.title}
                            {tip.isSponsored && (
                              <Badge className="bg-yellow-500 text-white mr-2">
                                ממומן
                              </Badge>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="prose max-w-none" dir={dir}>
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {tip.content}
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-gray-600">
                                  דירוג: {tip.rating}/5
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-500">
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

          {tips.length === 0 && !isLoading && (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
              <Lightbulb className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">אין טיפים זמינים</h3>
              <p className="text-gray-600">חזור מאוחר יותר לטיפים חדשים ומועילים</p>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <CardContent className="p-8 text-center relative z-10">
              <h2 className="text-2xl font-bold mb-4">יש לך טיפ שיכול לעזור לאחרים?</h2>
              <p className="text-lg mb-6 opacity-90">
                שתף את הטיפים שלך וקבל הכרה מקהילת הסטודנטים
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => setShowTipForm(true)}
              >
                שתף טיפ חדש
              </Button>
            </CardContent>
          </Card>
        </div>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>

      <TipSubmissionForm 
        isOpen={showTipForm} 
        onClose={() => setShowTipForm(false)} 
      />
    </>
  );
};

export default Tips;
