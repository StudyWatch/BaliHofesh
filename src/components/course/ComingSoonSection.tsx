
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComingSoonSectionProps {
  isLoggedIn: boolean;
}

const ComingSoonSection = ({ isLoggedIn }: ComingSoonSectionProps) => {
  const { toast } = useToast();

  const handleSummariesClick = () => {
    toast({
      title: "🧠 סיכומים בקרוב!",
      description: "הסיכומים ייפתחו בקרוב – הישארו מעודכנים!",
    });
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="p-6">
        <Button 
          onClick={handleSummariesClick}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-6 h-6" />
            <span className="font-bold text-lg">🧠 סיכומים בקרוב</span>
            <Lock className="w-4 h-4" />
          </div>
        </Button>
        <p className="text-center text-sm text-purple-600 mt-3">
          סיכומים, דפי נוסחאות ותרגולים יהיו זמינים בקרוב למשתמשים רשומים
        </p>
      </CardContent>
    </Card>
  );
};

export default ComingSoonSection;
