import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Clock, Trash2, Pencil } from "lucide-react";
import {
  useStudyPartners,
  useDeleteStudyPartner,
  useUserActiveStudyPartner,
} from "@/hooks/useStudyPartners";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import StudyPartnerModal from "./StudyPartnerModal";

interface StudyPartnersSectionProps {
  courseId: string;
  isLoggedIn: boolean;
}

const StudyPartnersSection = ({ courseId, isLoggedIn }: StudyPartnersSectionProps) => {
  const { data: studyPartners = [], refetch } = useStudyPartners(courseId);
  const { data: activeRequest, refetch: refetchActive } = useUserActiveStudyPartner(courseId);
  const deleteStudyPartner = useDeleteStudyPartner();
  const { toast } = useToast();

  // שליטה על מודל (יצירה/עריכה)
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // טען את המשתמש הנוכחי
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    })();
  }, []);

  // פתיחת מודל ליצירה
  const handleOpenCreate = () => {
    if (activeRequest) {
      toast({
        title: "כבר פתחת בקשה!",
        description: "ניתן לערוך או למחוק את הבקשה הקיימת.",
        variant: "destructive",
      });
      return;
    }
    setInitialData(null);
    setEditMode(false);
    setModalOpen(true);
  };

  // פתיחת מודל עריכה
  const handleOpenEdit = (partner: any) => {
    setInitialData(partner);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleContactPartner = (email: string, name: string) => {
    const subject = encodeURIComponent("שותפות ללמידה בקורס");
    const body = encodeURIComponent(`שלום ${name},\n\nראיתי את הבקשה שלך לשותפות ללמידה באתר. אשמח ליצור קשר!\n\n`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleDeletePartner = async (partnerId: string) => {
    try {
      await deleteStudyPartner.mutateAsync(partnerId);
      toast({
        title: "הצלחה",
        description: "הבקשה נמחקה בהצלחה",
      });
      refetch?.();
      refetchActive?.();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הבקשה",
        variant: "destructive",
      });
    }
  };

  if (!isLoggedIn) return null;

  return (
    <Card className="mb-6 shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-xl font-bold">
          🧑‍🤝‍🧑 שותפי למידה
          <Button
            className="bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white shadow px-6"
            onClick={handleOpenCreate}
            disabled={!!activeRequest}
          >
            <UserPlus className="inline-block mr-2" />
            אני רוצה ללמוד עם אחרים
          </Button>
        </CardTitle>
        {activeRequest && (
          <div className="mt-3 text-pink-700 text-center">
            <span>כבר פתחת בקשה פעילה. ניתן לערוך או למחוק אותה.</span>
            <Button
              variant="link"
              className="text-indigo-700 font-bold mx-2"
              onClick={() => handleOpenEdit(activeRequest)}
            >
              <Pencil className="inline w-4 h-4 ml-1" />
              ערוך בקשה קיימת
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {studyPartners.length === 0 ? (
          <p className="text-center text-gray-500 py-4">אין מודעות פעילות כרגע</p>
        ) : (
          <div className="flex flex-wrap gap-6 justify-end">
            {studyPartners.map((partner) => {
              const name = partner.profiles?.name || "משתמש אנונימי";
              const email = partner.profiles?.email || "";
              const avatar = partner.avatar_url ||
                partner.profiles?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
              const availability = partner.available_hours || [];
              const isMine = partner.user_id === currentUserId;

              return (
                <div
                  key={partner.id}
                  className="w-[320px] min-h-[200px] bg-white border rounded-2xl shadow-md p-5 flex flex-col items-center relative"
                >
                  {/* כפתור מחיקה */}
                  {isMine && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 left-2 text-red-500 hover:bg-red-50"
                      onClick={() => handleDeletePartner(partner.id)}
                      title="מחק מודעה"
                    >
                      <Trash2 />
                    </Button>
                  )}
                  {/* כפתור עריכה */}
                  {isMine && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-orange-500 hover:bg-orange-100"
                      onClick={() => handleOpenEdit(partner)}
                      title="ערוך מודעה"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      ערוך
                    </Button>
                  )}
                  {/* פרטי משתמש */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold text-xl">{name}</span>
                    <span className="text-sm text-gray-600">{partner.description}</span>
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 my-2 rounded-full border border-gray-300"
                    />
                  </div>
                  {/* זמינות */}
                  {availability.length > 0 && (
                    <div className="flex items-center gap-1 my-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 text-sm">
                        <Clock className="w-4 h-4 mr-1 inline" />
                        {availability[0] === "אין זמן מסוים"
                          ? "אין זמן מסוים"
                          : availability.join(" | ")}
                      </Badge>
                    </div>
                  )}
                  {/* כפתור שליחה */}
                  <div className="flex justify-between w-full items-center mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleContactPartner(email, name)}
                    >
                      שלח הודעה <Mail className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {/* מודל עריכה / יצירה (פותח רק אם modalOpen true) */}
      {modalOpen && (
        <StudyPartnerModal
          courseId={courseId}
          isLoggedIn={isLoggedIn}
          editMode={editMode}
          initialData={initialData}
          open={modalOpen}
          setOpen={setModalOpen}
        />
      )}
    </Card>
  );
};

export default StudyPartnersSection;
