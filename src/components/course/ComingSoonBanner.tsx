import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, FileText, Calculator, BookOpen } from 'lucide-react';

const ComingSoonBanner = () => {
  return (
    <Card className="sticky top-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-xl z-10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">🧠 סיכומים, נוסחאות ותרגולים</h3>
              <p className="text-purple-100">יתווספו בקרוב! עקבו אחר העדכונים</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-200" />
            <Calculator className="w-5 h-5 text-purple-200" />
            <BookOpen className="w-5 h-5 text-purple-200" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">סיכומי חומר</div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">נוסחאות מרכזיות</div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">תרגולים ממוקדים</div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">מבחנים מדמים</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComingSoonBanner;