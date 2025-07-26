
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Eye, MessageCircle, Volume2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Course {
  id: string;
  name_he: string;
  code?: string;
  enable_collaboration: boolean;
  institutions: {
    name_he: string;
  };
}

const CollaborationManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Open University courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['open-university-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          institutions (
            name_he
          )
        `)
        .eq('institutions.name_he', 'האוניברסיטה הפתוחה');
      
      if (error) throw error;
      return data as Course[];
    }
  });

  // Fetch course groups
  const { data: courseGroups = [] } = useQuery({
    queryKey: ['course-groups-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_groups')
        .select(`
          *,
          courses (
            name_he,
            code
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch study partners
  const { data: studyPartners = [] } = useQuery({
    queryKey: ['study-partners-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_partners')
        .select(`
          *,
          courses (
            name_he,
            code
          ),
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch study rooms
  const { data: studyRooms = [] } = useQuery({
    queryKey: ['study-rooms-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_rooms')
        .select(`
          *,
          courses (
            name_he,
            code
          ),
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateCollaboration = useMutation({
    mutationFn: async ({ courseId, enabled }: { courseId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('courses')
        .update({ enable_collaboration: enabled })
        .eq('id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      toast({
        title: "הצלחה",
        description: "הגדרות הקורס עודכנו"
      });
    }
  });

  const updateCourseGroup = useMutation({
    mutationFn: async ({ courseId, whatsappLink, discordLink }: { 
      courseId: string; 
      whatsappLink: string; 
      discordLink: string; 
    }) => {
      const { error } = await supabase
        .from('course_groups')
        .upsert({
          course_id: courseId,
          whatsapp_link: whatsappLink || null,
          discord_link: discordLink || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-groups-admin'] });
      toast({
        title: "הצלחה",
        description: "קישורי הקורס עודכנו"
      });
    }
  });

  const deleteStudyPartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('study_partners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-partners-admin'] });
      toast({
        title: "הצלחה",
        description: "המודעה נמחקה"
      });
    }
  });

  const updateStudyRoom = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('study_rooms')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-rooms-admin'] });
      toast({
        title: "הצלחה",
        description: "סטטוס המפגש עודכן"
      });
    }
  });

  if (isLoading) {
    return <div className="p-4">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ניהול שיתוף פעולה - קורסי האוניברסיטה הפתוחה</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses">קורסים</TabsTrigger>
              <TabsTrigger value="groups">קבוצות</TabsTrigger>
              <TabsTrigger value="partners">שותפי לימוד</TabsTrigger>
              <TabsTrigger value="rooms">מפגשים</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">הפעלת שיתוף פעולה בקורסים</h3>
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{course.name_he}</h4>
                      {course.code && <p className="text-sm text-gray-500">קוד: {course.code}</p>}
                    </div>
                    <Switch
                      checked={course.enable_collaboration}
                      onCheckedChange={(checked) => 
                        updateCollaboration.mutate({ courseId: course.id, enabled: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ניהול קישורי קבוצות</h3>
                {courses.map((course) => (
                  <CourseGroupEditor
                    key={course.id}
                    course={course}
                    courseGroup={courseGroups.find(cg => cg.course_id === course.id)}
                    onUpdate={(whatsappLink, discordLink) => 
                      updateCourseGroup.mutate({ 
                        courseId: course.id, 
                        whatsappLink, 
                        discordLink 
                      })
                    }
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="partners" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ניהול מודעות שותפי לימוד</h3>
                {studyPartners.map((partner: any) => (
                  <div key={partner.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">
                          {partner.courses?.name_he} ({partner.courses?.code})
                        </h4>
                        <p className="text-sm text-gray-500">
                          {partner.profiles?.name} - {partner.profiles?.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteStudyPartner.mutate(partner.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{partner.description}</p>
                    <div className="text-xs text-gray-400">
                      {new Date(partner.created_at).toLocaleString('he-IL')}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ניהול מפגשי לימוד</h3>
                {studyRooms.map((room: any) => (
                  <div key={room.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{room.title}</h4>
                        <p className="text-sm text-gray-500">
                          {room.courses?.name_he} ({room.courses?.code})
                        </p>
                        <p className="text-xs text-gray-400">
                          {room.profiles?.name} - {room.profiles?.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={room.status === 'open' ? 'default' : 'secondary'}>
                          {room.status === 'open' ? 'פתוח' : 'סגור'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStudyRoom.mutate({ 
                            id: room.id, 
                            status: room.status === 'open' ? 'closed' : 'open' 
                          })}
                        >
                          {room.status === 'open' ? 'סגור' : 'פתח'}
                        </Button>
                      </div>
                    </div>
                    {room.description && (
                      <p className="text-gray-600 mb-2">{room.description}</p>
                    )}
                    <div className="text-xs text-gray-400">
                      נפתח: {new Date(room.created_at).toLocaleString('he-IL')} |
                      פוגה: {new Date(room.expires_at).toLocaleString('he-IL')}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const CourseGroupEditor = ({ course, courseGroup, onUpdate }: any) => {
  const [whatsappLink, setWhatsappLink] = useState(courseGroup?.whatsapp_link || '');
  const [discordLink, setDiscordLink] = useState(courseGroup?.discord_link || '');

  const handleSave = () => {
    onUpdate(whatsappLink, discordLink);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-3">{course.name_he}</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            <MessageCircle className="w-4 h-4 inline ml-1" />
            קישור WhatsApp
          </label>
          <Input
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            <Volume2 className="w-4 h-4 inline ml-1" />
            קישור Discord
          </label>
          <Input
            value={discordLink}
            onChange={(e) => setDiscordLink(e.target.value)}
            placeholder="https://discord.gg/..."
            className="text-right"
          />
        </div>
        <Button onClick={handleSave} size="sm">
          שמור שינויים
        </Button>
      </div>
    </div>
  );
};

export default CollaborationManagement;
