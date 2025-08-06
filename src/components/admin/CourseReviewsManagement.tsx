import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Star,
  Trash2,
  Eye,
  EyeOff,
  ThumbsUp,
  MessageSquare,
  Calendar,
  BookOpen
} from 'lucide-react';
import {
  useAdminCourseReviews,
  useDeleteCourseReviewAdmin,
  useToggleReviewAnonymous
} from '@/hooks/useAdminCourseReviews';
import { useToast } from '@/hooks/use-toast';

const CourseReviewsManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const { data: reviews = [], isLoading } = useAdminCourseReviews();
  const deleteReview = useDeleteCourseReviewAdmin();
  const toggleAnonymous = useToggleReviewAnonymous();

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('האם למחוק ביקורת זו?')) {
      try {
        await deleteReview.mutateAsync(reviewId);
        toast({
          title: "הביקורת נמחקה",
          description: "הביקורת הוסרה מהמערכת"
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה במחיקה",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleAnonymous = async (reviewId: string, currentStatus: boolean) => {
    try {
      await toggleAnonymous.mutateAsync({
        reviewId,
        isAnonymous: !currentStatus
      });
      toast({
        title: "סטטוס עודכן",
        description: `הביקורת ${!currentStatus ? 'הוסתרה' : 'נחשפה'}`
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הסטטוס",
        variant: "destructive"
      });
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' ||
      review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course?.name_he?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user_profile?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = filterRating === null || review.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5" aria-label={`דירוג: ${rating} כוכבים`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          aria-hidden
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card className="shadow-lg border-2 border-blue-100 bg-gradient-to-tr from-white to-blue-50/70 rounded-3xl">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="flex items-center gap-3 text-blue-900 text-2xl font-black tracking-tight">
              <MessageSquare className="w-7 h-7 text-blue-500 drop-shadow" />
              ניהול ביקורות קורסים
            </CardTitle>
            <div className="text-blue-700 font-bold text-sm md:mt-0 mt-2">
              סה״כ {reviews.length} ביקורות
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                placeholder="חפש תוכן, קורס או שם סטודנט..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pr-10"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRating === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(null)}
                className="font-bold"
              >הכל</Button>
              {[5, 4, 3, 2, 1].map(rating => (
                <Button
                  key={rating}
                  variant={filterRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(rating)}
                  className="flex items-center gap-0.5 font-bold"
                >
                  {rating}
                  <Star className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-6"></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg mb-3"></div>
              ))}
            </CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                אין ביקורות תואמות
              </h3>
              <p className="text-gray-600">
                נסה לשנות את החיפוש או הסינון
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card
              key={review.id}
              className="shadow-lg border-2 border-blue-50 bg-white/90 rounded-2xl hover:shadow-2xl transition group"
            >
              <CardContent className="p-5 sm:p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left: User + Course + Date */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-blue-200">
                        <AvatarImage
                          src={review.is_anonymous ? undefined : review.user_profile?.avatar_url}
                        />
                        <AvatarFallback>
                          {review.is_anonymous ? '?' : review.user_profile?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 font-bold text-blue-950">
                          {review.is_anonymous
                            ? 'סטודנט אנונימי'
                            : review.user_profile?.name}
                          {review.is_anonymous && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 ml-1">אנונימי</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {review.user_profile?.email}
                        </div>
                      </div>
                      <div className="ml-4 hidden sm:block">{renderStars(review.rating)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700 mt-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-bold">{review.course?.name_he}</span>
                      {review.course?.name_en && (
                        <span className="text-xs text-blue-400">({review.course.name_en})</span>
                      )}
                    </div>
                  </div>
                  {/* Middle: Review */}
                  <div className="flex-1 mt-2 md:mt-0">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="sm:hidden">{renderStars(review.rating)}</div>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(review.created_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">תוכן הביקורת:</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.content}</p>
                    </div>
                    {review.tips && (
                      <div className="mt-2">
                        <h5 className="font-semibold text-green-800 mb-1">טיפים לסטודנטים:</h5>
                        <div className="bg-green-50 border-r-4 border-green-300 px-3 py-2 rounded">
                          <span className="text-green-900">{review.tips}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Right: Actions */}
                  <div className="flex flex-row md:flex-col gap-2 items-center justify-center min-w-[90px] mt-2 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAnonymous(review.id, review.is_anonymous)}
                      className="flex items-center gap-2"
                      title={review.is_anonymous ? "חשוף ביקורת" : "הפוך לאנונימי"}
                      disabled={toggleAnonymous.isPending}
                    >
                      {review.is_anonymous ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {review.is_anonymous ? 'חשוף' : 'אנונימי'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
                      className="flex items-center gap-2"
                      title="מחק ביקורת"
                      disabled={deleteReview.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק
                    </Button>
                    <div className="flex items-center gap-1 mt-2 text-gray-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs">{review.helpful_count} מועיל</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseReviewsManagement;
