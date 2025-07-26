import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Star, MapPin, Phone, Mail, BookOpen, Clock, DollarSign, GraduationCap, Award, EyeOff, Eye, Pencil, Save } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TutorProfileEdit = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const [tutor, setTutor] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // טען נתוני מורה (משתמש מחובר)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setTutor(data);
        setForm(data);
        fetchReviews(data.id);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line
  }, []);

  // טען ביקורות
  const fetchReviews = async (tutorId: string) => {
    const { data } = await supabase
      .from('tutor_reviews')
      .select('id, review_text, rating, is_public, created_at, profiles(name, avatar_url)')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });
    setReviews(data || []);
  };

  // עדכון פרופיל
  const handleSave = async () => {
    const { error } = await supabase
      .from('tutors')
      .update({
        name: form.name,
        hourly_rate: form.hourly_rate,
        trial_lesson: form.trial_lesson,
        trial_price: form.trial_price,
        location: form.location,
        description: form.description,
        experience: form.experience,
        is_online: form.is_online
      })
      .eq('id', tutor.id);
    if (!error) {
      setTutor({ ...tutor, ...form });
      setIsEditing(false);
      alert('עודכן בהצלחה!');
    }
  };

  // שינוי פומביות ביקורת
  const toggleReviewVisibility = async (reviewId: string, isPublic: boolean) => {
    await supabase.from('tutor_reviews')
      .update({ is_public: !isPublic })
      .eq('id', reviewId);
    fetchReviews(tutor.id);
  };

  if (loading || !form) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100" dir={dir}>
      <Header />
      <div className="container mx-auto px-4 py-10">
        <Card className="mb-8 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Info ועריכה */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-indigo-100 p-4 rounded-full">
                    <GraduationCap className="w-12 h-12 text-indigo-600" />
                  </div>
                  <div>
                    {isEditing ? (
                      <Input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="text-3xl font-bold mb-2"
                        maxLength={32}
                      />
                    ) : (
                      <h1 className="text-4xl font-bold text-indigo-900">{tutor.name}</h1>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {tutor.is_verified && (
                        <Badge className="bg-green-500 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          מאומת
                        </Badge>
                      )}
                      {form.is_online && (
                        <span className="flex items-center gap-1 text-green-600">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-sm">זמין כעת</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-indigo-900 mb-6">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-semibold">{tutor.rating}</span>
                    <span className="opacity-70">({tutor.reviews_count} ביקורות)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5" />
                    {isEditing ? (
                      <Input
                        type="number"
                        value={form.hourly_rate}
                        min={40}
                        max={600}
                        onChange={e => setForm({ ...form, hourly_rate: +e.target.value })}
                        className="w-24"
                      />
                    ) : (
                      <span className="text-lg font-semibold">₪{tutor.hourly_rate} לשעה</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" />
                    {isEditing ? (
                      <Input
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        className="w-36"
                        maxLength={24}
                      />
                    ) : (
                      <span>{tutor.location}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    {isEditing ? (
                      <Input
                        value={form.availability || ''}
                        onChange={e => setForm({ ...form, availability: e.target.value })}
                        className="w-36"
                        maxLength={32}
                      />
                    ) : (
                      <span>{tutor.availability || "לא צוינה"}</span>
                    )}
                  </div>
                </div>

                {/* שיעור ניסיון */}
                <div className="flex gap-4 items-center mb-4">
                  <Switch
                    checked={form.trial_lesson}
                    onCheckedChange={checked => setForm({ ...form, trial_lesson: checked })}
                    id="trial_lesson"
                  />
                  <label htmlFor="trial_lesson" className="font-medium">
                    הצע שיעור ניסיון
                  </label>
                  {form.trial_lesson && (
                    <Input
                      type="number"
                      value={form.trial_price || ''}
                      onChange={e => setForm({ ...form, trial_price: +e.target.value })}
                      className="w-28 ml-2"
                      placeholder="מחיר מיוחד"
                    />
                  )}
                </div>
                {/* תיאור */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">תיאור אישי</label>
                  {isEditing ? (
                    <Textarea
                      value={form.description || ''}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className="w-full"
                      maxLength={600}
                    />
                  ) : (
                    <p className="text-gray-700">{tutor.description}</p>
                  )}
                </div>
                {/* ניסיון */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">ניסיון והכשרה</label>
                  {isEditing ? (
                    <Textarea
                      value={form.experience || ''}
                      onChange={e => setForm({ ...form, experience: e.target.value })}
                      rows={2}
                      className="w-full"
                      maxLength={300}
                    />
                  ) : (
                    <p className="text-gray-700">{tutor.experience}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {isEditing ? (
                    <Button className="bg-indigo-600 text-white" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      שמור שינויים
                    </Button>
                  ) : (
                    <Button variant="outline" className="border-indigo-500" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      ערוך פרופיל
                    </Button>
                  )}
                </div>
              </div>

              {/* ניהול ביקורות */}
              <div className="w-full lg:max-w-xs mt-10 lg:mt-0">
                <Card className="shadow">
                  <CardHeader>
                    <CardTitle className="flex gap-2 items-center">
                      <Star className="w-5 h-5 text-yellow-500" />
                      ניהול ביקורות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length === 0 && (
                      <div className="text-gray-400 text-center py-3">
                        אין עדיין ביקורות
                      </div>
                    )}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {reviews.map((r) => (
                        <div
                          key={r.id}
                          className="flex gap-3 items-center justify-between p-2 rounded bg-gray-50"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="font-bold">{r.rating}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {r.profiles?.name || "סטודנט"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 mt-1">{r.review_text}</div>
                          </div>
                          <Button
                            size="sm"
                            variant={r.is_public ? "outline" : "secondary"}
                            className="rounded-full p-2"
                            onClick={() => toggleReviewVisibility(r.id, r.is_public)}
                            title={r.is_public ? "הסתר מהפרופיל" : "הצג בפרופיל"}
                          >
                            {r.is_public ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default TutorProfileEdit;
