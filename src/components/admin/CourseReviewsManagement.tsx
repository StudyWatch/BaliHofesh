import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Star, 
  Trash2, 
  Eye, 
  EyeOff,
  ThumbsUp,
  MessageSquare,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';
import { useAdminCourseReviews, useDeleteCourseReviewAdmin, useToggleReviewAnonymous } from '@/hooks/useAdminCourseReviews';
import { useToast } from '@/hooks/use-toast';

const CourseReviewsManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const { data: reviews = [], isLoading } = useAdminCourseReviews();
  const deleteReview = useDeleteCourseReviewAdmin();
  const toggleAnonymous = useToggleReviewAnonymous();

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הביקורת?')) {
      try {
        await deleteReview.mutateAsync(reviewId);
        toast({
          title: "הביקורת נמחקה",
          description: "הביקורת הוסרה בהצלחה מהמערכת"
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה במחיקת הביקורת",
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
        title: "הסטטוס עודכן",
        description: `הביקורת ${!currentStatus ? 'הוסתרה' : 'נחשפה'} בהצלחה`
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
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course?.name_he.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user_profile?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === null || review.rating === filterRating;
    
    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניהול ביקורות קורסים</h2>
          <p className="text-gray-600 mt-1">
            סה״כ {reviews.length} ביקורות במערכת
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי תוכן, קורס או משתמש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRating === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(null)}
              >
                הכל
              </Button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={filterRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(rating)}
                  className="flex items-center gap-1"
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
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                אין ביקורות תואמות
              </h3>
              <p className="text-gray-600">
                נסה לשנות את מונחי החיפוש או הסינון
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Review Content */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.is_anonymous ? '' : review.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {review.is_anonymous ? '?' : review.user_profile?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {review.is_anonymous ? 'סטודנט אנונימי' : review.user_profile?.name}
                            </span>
                            {review.is_anonymous && (
                              <Badge variant="secondary" className="text-xs">
                                אנונימי
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {review.user_profile?.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-medium">{review.course?.name_he}</span>
                        {review.course?.name_en && (
                          <span className="text-sm">({review.course.name_en})</span>
                        )}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">תוכן הביקורת:</h4>
                      <p className="text-gray-700 leading-relaxed">{review.content}</p>
                    </div>

                    {/* Tips */}
                    {review.tips && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">טיפים:</h4>
                        <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                          <p className="text-gray-700 leading-relaxed">{review.tips}</p>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {review.helpful_count} מועיל
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(review.created_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAnonymous(review.id, review.is_anonymous)}
                      className="flex items-center gap-2"
                      disabled={toggleAnonymous.isPending}
                    >
                      {review.is_anonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {review.is_anonymous ? 'חשוף' : 'הסתר'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteReview.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק
                    </Button>
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