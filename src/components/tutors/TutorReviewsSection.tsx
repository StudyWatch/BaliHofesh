import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Trash2, User } from 'lucide-react';

interface TutorReviewsSectionProps {
  tutorId: string;
  tutorName?: string;
}

interface Review {
  id: string;
  tutor_id: string;
  user_id: string;
  review_text: string;
  created_at: string;
  profiles?: {
    name?: string;
    avatar_url?: string;
  };
}

const TutorReviewsSection: React.FC<TutorReviewsSectionProps> = ({ tutorId, tutorName = 'המורה' }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
    fetchReviews();
    // eslint-disable-next-line
  }, [tutorId]);

  // שליפת ביקורות
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('tutor_reviews')
      .select('id, tutor_id, user_id, review_text, created_at, profiles(name, avatar_url)')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data as Review[]);
    } else {
      setReviews([]);
      if (error) toast({ title: 'שגיאה בטעינת ביקורות', variant: 'destructive' });
    }
  };

  // שליחה או עדכון ביקורת
  const handleSubmit = async () => {
    if (!reviewText.trim() || !userId) return;

    try {
      if (isEditing && editingReviewId) {
        const { error } = await supabase
          .from('tutor_reviews')
          .update({ review_text: reviewText })
          .eq('id', editingReviewId);
        if (error) throw error;
        toast({ title: 'הביקורת עודכנה' });
      } else {
        // מניעת כפילות ביקורות
        const exists = reviews.find(r => r.user_id === userId);
        if (exists) {
          toast({ title: 'כבר הוספת ביקורת', variant: 'destructive' });
          return;
        }
        const { error } = await supabase
          .from('tutor_reviews')
          .insert({ tutor_id: tutorId, user_id: userId, review_text: reviewText });
        if (error) throw error;
        toast({ title: 'הביקורת נוספה!' });
      }
      setReviewText('');
      setIsEditing(false);
      setEditingReviewId(null);
      fetchReviews();
    } catch {
      toast({ title: 'שגיאה בשמירה', variant: 'destructive' });
    }
  };

  // עריכת ביקורת
  const handleEdit = (review: Review) => {
    setReviewText(review.review_text);
    setIsEditing(true);
    setEditingReviewId(review.id);
  };

  // מחיקת ביקורת
  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('האם למחוק את הביקורת?')) return;
    const { error } = await supabase.from('tutor_reviews').delete().eq('id', reviewId);
    if (!error) {
      toast({ title: 'הביקורת נמחקה' });
      fetchReviews();
    } else {
      toast({ title: 'שגיאה במחיקה', variant: 'destructive' });
    }
  };

  const userAlreadyReviewed = reviews.find(r => r.user_id === userId);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold">💬 ביקורות עבור {tutorName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* טופס כתיבת ביקורת */}
        {userId && !userAlreadyReviewed && !isEditing && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="כתוב ביקורת על המורה..."
              rows={3}
              className="text-sm"
              maxLength={450}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleSubmit} disabled={!reviewText.trim()}>
                שלח ביקורת
              </Button>
            </div>
          </div>
        )}

        {/* עריכת ביקורת */}
        {isEditing && (
          <div className="bg-yellow-50 p-4 rounded-lg border">
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="ערוך את הביקורת שלך..."
              rows={3}
              className="text-sm"
              maxLength={450}
            />
            <div className="flex justify-between mt-2">
              <Button variant="outline" onClick={() => { setIsEditing(false); setReviewText(''); }}>
                ביטול
              </Button>
              <Button onClick={handleSubmit}>עדכן</Button>
            </div>
          </div>
        )}

        {/* אין ביקורות */}
        {reviews.length === 0 && (
          <div className="text-gray-500 text-center py-4">עדיין אין ביקורות.</div>
        )}

        {/* רשימת ביקורות */}
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-3 border-b pb-3">
            <Avatar>
              <AvatarImage src={review.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                {review.profiles?.name?.[0] || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold">{review.profiles?.name || "סטודנט"}</span>
                {review.user_id === userId && (
                  <div className="flex gap-2 text-gray-400">
                    <button onClick={() => handleEdit(review)} title="ערוך">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(review.id)} title="מחק">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{review.review_text}</p>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(review.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TutorReviewsSection;
