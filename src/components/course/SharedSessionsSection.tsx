import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ExternalLink, Clock, User, Video, Calendar, Trash2, Pencil } from 'lucide-react';
import { useSharedSessions, useDeleteSharedSession, useUpdateSharedSession } from '@/hooks/useSharedSessions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SharedStudyModal from './SharedStudyModal';
import ScheduledSessionModal from './ScheduledSessionModal';

const platformMap = {
  zoom: { emoji: '🔵', label: 'Zoom' },
  'google-meet': { emoji: '🟢', label: 'Google Meet' },
  teams: { emoji: '🟣', label: 'Microsoft Teams' },
  other: { emoji: '🔗', label: 'אחר' }
};

function getPlatformInfo(platform: string) {
  return platformMap[platform as keyof typeof platformMap] || { emoji: '🔗', label: platform || 'פלטפורמה' };
}

function formatDateTime(ts?: string) {
  if (!ts) return null;
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('he-IL'),
    time: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  };
}

function getSessionStatus(session: any) {
  const now = new Date();
  if (!session.scheduled_start_time) {
    // LIVE מיידי
    const expires = new Date(session.expires_at);
    if (now < expires) return 'live';
    return 'ended';
  }
  const start = new Date(session.scheduled_start_time);
  const end = new Date(start.getTime() + ((session.estimated_duration || 120) * 60000));
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'ended';
}

function getTimeRemaining(expiresAt: string) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMins = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 60000));
  if (diffMins >= 60) {
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h} שעות${m ? ` ו-${m} דק'` : ''}`;
  }
  return `${diffMins} דקות`;
}

interface SharedSessionsSectionProps {
  courseId: string;
  isLoggedIn: boolean;
}

const SharedSessionsSection: React.FC<SharedSessionsSectionProps> = ({ courseId, isLoggedIn }) => {
  const { data: sessions, isLoading } = useSharedSessions(courseId);
  const { mutate: deleteSession } = useDeleteSharedSession();
  const { mutate: updateSession } = useUpdateSharedSession();
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);

  // שליטה בעריכה
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    meeting_link: string;
    estimated_duration: number;
    description: string;
  }>({ meeting_link: '', estimated_duration: 120, description: '' });

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      // האם יש לך הגדרה ל־isAdmin בפרופיל? (עדכן לפי מבנה שלך)
      if (data.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
          .then(({ data: prof }) => setIsAdmin(prof?.role === 'admin'));
      }
    });
  }, []);

  // ממיינים קודם LIVE ואז מתוזמנים לפי זמן, אחר כך היסטוריים
  const sortedSessions = (sessions ?? [])
    .sort((a, b) => {
      const statusA = getSessionStatus(a), statusB = getSessionStatus(b);
      if (statusA !== statusB) {
        if (statusA === 'live') return -1;
        if (statusB === 'live') return 1;
        if (statusA === 'upcoming') return -1;
        if (statusB === 'upcoming') return 1;
      }
      // מיון נוסף לפי זמן התחלה
      const tA = a.scheduled_start_time ? new Date(a.scheduled_start_time).getTime() : new Date(a.created_at).getTime();
      const tB = b.scheduled_start_time ? new Date(b.scheduled_start_time).getTime() : new Date(b.created_at).getTime();
      return tA - tB;
    });

  const handleJoinSession = (link: string) => {
    window.open(link, '_blank');
  };

  const handleDeleteSession = async (sessionId: string, userId: string) => {
    if (!(user && (user.id === userId || isAdmin))) {
      toast({ title: "רק פותח המפגש או אדמין יכולים למחוק", variant: "destructive" });
      return;
    }
    deleteSession(sessionId, {
      onSuccess: () => toast({ title: "המפגש נמחק בהצלחה" }),
      onError: () => toast({ title: "שגיאה במחיקה", variant: "destructive" }),
    });
  };

  // התחלת עריכה
  const startEdit = (session: any) => {
    setEditingId(session.id);
    setEditData({
      meeting_link: session.meeting_link,
      estimated_duration: session.estimated_duration || 120,
      description: session.description || '',
    });
  };

  // שמירת עריכה
  const saveEdit = (sessionId: string) => {
    updateSession(
      {
        sessionId,
        updates: {
          meeting_link: editData.meeting_link,
          // estimated_duration: editData.estimated_duration, // Will be added in migration
          description: editData.description,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "עודכן בהצלחה" });
          setEditingId(null);
        },
        onError: () => {
          toast({ title: "שגיאה בשמירה", variant: "destructive" });
        },
      }
    );
  };

  const MAX_SESSIONS = 4;
  const visibleSessions = showAll ? sortedSessions : sortedSessions.slice(0, MAX_SESSIONS);

  return (
    <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-green-900 flex items-center gap-3">
          <Video className="w-6 h-6" />
          מפגשי לימוד חיים
        </CardTitle>
        <p className="text-green-700">הצטרפו למפגשים, פתחו או תזמנו חדש!</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-6">
          <SharedStudyModal courseId={courseId} isLoggedIn={isLoggedIn} />
          {isLoggedIn && <ScheduledSessionModal courseId={courseId} isLoggedIn={isLoggedIn} />}
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-green-700">טוען מפגשים...</p>
          </div>
        ) : sessions && sessions.length > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleSessions.map((session: any) => {
                const sessionStatus = getSessionStatus(session);
                const platformInfo = getPlatformInfo(session.platform);
                const timeInfo = formatDateTime(session.scheduled_start_time);
                const showTime = timeInfo
                  ? `${timeInfo.date} • ${timeInfo.time} (${session.estimated_duration || 120} דק')`
                  : `פעיל עד: ${new Date(session.expires_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

                const canEdit = isLoggedIn && (session.user_id === user?.id || isAdmin);

                return (
                  <div
                    key={session.id}
                    className={`
                      bg-white rounded-2xl p-5 shadow-md border border-green-100
                      hover:shadow-xl transition-all duration-200
                      flex flex-col justify-between min-h-[250px]
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg truncate max-w-[150px]">{session.title}</h3>
                        <Badge
                          className={`font-semibold ${
                            sessionStatus === 'live'
                              ? 'bg-green-100 text-green-800 border-green-300 animate-pulse'
                              : sessionStatus === 'upcoming'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {sessionStatus === 'live'
                            ? '🔴 פעיל'
                            : sessionStatus === 'upcoming'
                            ? '⏰ מתוזמן'
                            : '✓ הסתיים'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{platformInfo.emoji}</span>
                        <span className="text-gray-500 text-xs">{platformInfo.label}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{session.profiles?.name || 'משתמש'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{showTime}</span>
                        </div>
                        {!session.scheduled_start_time && (
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            <span>נותרו {getTimeRemaining(session.expires_at)}</span>
                          </div>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-gray-700 bg-gray-50 p-2 rounded-lg mb-3 text-xs">{session.description}</p>
                      )}

                      {canEdit && (
                        <div className="flex gap-1 mb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            onClick={() => startEdit(session)}
                          >
                            <Pencil className="w-4 h-4" /> ערוך
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteSession(session.id, session.user_id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                מחיקה (רק ליוצר/אדמין)
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}

                      {editingId === session.id && canEdit && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-2 space-y-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">לינק מפגש:</label>
                            <input
                              type="text"
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={editData.meeting_link}
                              onChange={e => setEditData(d => ({ ...d, meeting_link: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">משך (דקות):</label>
                            <input
                              type="number"
                              min={10}
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={editData.estimated_duration}
                              onChange={e => setEditData(d => ({ ...d, estimated_duration: parseInt(e.target.value || '120') }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">תיאור:</label>
                            <textarea
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={editData.description}
                              onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => saveEdit(session.id)}
                            >
                              שמור שינויים
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              ביטול
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        className={`flex-1 font-semibold ${
                          sessionStatus === 'live'
                            ? 'bg-green-600 hover:bg-green-700 animate-pulse'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        onClick={() => handleJoinSession(session.meeting_link)}
                        disabled={sessionStatus === 'ended'}
                      >
                        <ExternalLink className="w-4 h-4 ml-1" />
                        {sessionStatus === 'live'
                          ? 'הצטרף עכשיו'
                          : sessionStatus === 'upcoming'
                          ? 'צפייה'
                          : 'הסתיים'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {sessions.length > MAX_SESSIONS && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="text-green-700 font-semibold"
                >
                  {showAll ? 'הצג פחות' : 'הצג את כל המפגשים'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">אין מפגשי לימוד פעילים כרגע</h3>
            <p className="text-gray-600 mb-4">תהיה הראשון שפותח מפגש לימוד!</p>
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg inline-block">
              💡 טיפ: צרו מפגש מתוזמן מראש כדי שאחרים יוכלו להתכונן
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedSessionsSection;
