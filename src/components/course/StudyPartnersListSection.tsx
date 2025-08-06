import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Clock, Pencil, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import {
  useStudyPartners,
  useDeleteStudyPartner,
  StudyPartner,
} from "@/hooks/useStudyPartners";
import { useToast } from "@/hooks/use-toast";
import StudyPartnerModal from "./StudyPartnerModal";
import StudyPartnersIndicator from "./StudyPartnersIndicator";

interface StudyPartnersListSectionProps {
  courseId: string;
  isLoggedIn: boolean;
}

const getAvatar = (partner: StudyPartner) =>
  partner.avatar_url ||
  partner.profiles?.avatar_url ||
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
    (partner.profiles?.name || partner.contact_info || partner.id).slice(0, 20)
  )}`;

const StudyPartnersListSection: React.FC<StudyPartnersListSectionProps> = ({
  courseId,
  isLoggedIn,
}) => {
  const { data: partners = [], isLoading, refetch } = (
    useStudyPartners(courseId) as {
      data: StudyPartner[];
      isLoading: boolean;
      refetch: () => void;
    }
  );

  const deleteMutation = useDeleteStudyPartner();
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPartner, setEditingPartner] = useState<StudyPartner | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  const alreadyRequested = partners.some((p) => p.user_id === currentUser?.id);
  const displayedPartners = showAll ? partners : partners.slice(0, 6);

  const handleDelete = (id: string, ownerId: string) => {
    if (
      !currentUser ||
      (currentUser.id !== ownerId && currentUser.user_metadata?.role !== "admin")
    ) {
      toast({
        title: "שגיאה",
        description: "אין לך הרשאה למחוק",
        variant: "destructive",
      });
      return;
    }
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "הבקשה נמחקה" });
        refetch?.();
      },
    });
  };

  const handleContact = (partner: StudyPartner) => {
    if (partner.contact_info) {
      if (partner.contact_info.includes("@")) {
        window.location.href = `mailto:${partner.contact_info}?subject=שותפות ללמידה באתר BaliHofesh`;
      } else if (partner.contact_info.match(/^05\d{8}$/)) {
        window.open(`https://wa.me/972${partner.contact_info.slice(1)}`, "_blank");
      }
    } else {
      toast({
        title: "📩 הודעה",
        description: "אין פרטי קשר - פנה למנהל האתר או נסה שותף אחר.",
      });
    }
  };

  // פתיחת מודל ליצירת שותף חדש
  const handleOpenCreate = () => {
    setEditMode(false);
    setEditingPartner(null);
    setModalOpen(true);
  };

  // פתיחת מודל לעריכת שותף קיים
  const handleOpenEdit = (partner: StudyPartner) => {
    setEditMode(true);
    setEditingPartner(partner);
    setModalOpen(true);
  };

  return (
    <Card className="mx-auto my-8 max-w-7xl shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            🤝 שותפים ללמידה ({partners.length})
          </CardTitle>
          <StudyPartnersIndicator courseId={courseId} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex flex-col items-center">
          <Button
            className="mb-2 w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white shadow-xl font-bold py-3 px-7 rounded-2xl text-lg transition"
            onClick={handleOpenCreate}
            disabled={alreadyRequested}
          >
            <UserPlus className="inline-block mr-2" />
            אני רוצה ללמוד עם אחרים
          </Button>
          {alreadyRequested && (
            <p className="mt-2 text-sm text-red-500 text-center">
              בקשה קיימת לזיהוי שותף 💡 תוכל לערוך או למחוק אותה בכל עת.
            </p>
          )}
        </div>

        {modalOpen && (
          <StudyPartnerModal
            courseId={courseId}
            isLoggedIn={isLoggedIn}
            editMode={editMode}
            initialData={editingPartner}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              setModalOpen(false);
              setEditingPartner(null);
              refetch?.();
            }}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-300 border-t-transparent" />
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="mb-2 text-lg">🔍 אין עדיין שותפים זמינים</p>
            <p className="text-sm">היה הראשון להציע שיתוף פעולה בקורס הזה!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedPartners.map((partner) => {
                const name = partner.profiles?.name || "סטודנט";
                const canDelete =
                  currentUser &&
                  (currentUser.id === partner.user_id ||
                    currentUser.user_metadata?.role === "admin");
                const isMine = currentUser?.id === partner.user_id;

                return (
                  <Card
                    key={partner.id}
                    className="relative p-4 rounded-xl border border-gray-200 shadow hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getAvatar(partner)} alt={name} />
                        <AvatarFallback>
                          <Mail className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                        <p className="text-sm text-gray-600">{partner.description || "אין תיאור"}</p>
                        <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {partner.available_hours?.length ? (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                              {partner.available_hours.join(", ")}
                            </span>
                          ) : (
                            <span className="text-gray-400">אין זמן מסוים</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleContact(partner)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 ml-2" />
                        שלח הודעה
                      </Button>
                      {isMine && (
                        <Button
                          onClick={() => handleOpenEdit(partner)}
                          variant="ghost"
                          className="flex-1 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4 ml-2" />
                          ערוך
                        </Button>
                      )}
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(partner.id, partner.user_id)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                        aria-label="מחק בקשה"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </Card>
                );
              })}
            </div>
            {partners.length > 6 && (
              <div className="mt-6 flex justify-center">
                <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? (
                    <>
                      הסתר <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      הצג את כולם <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyPartnersListSection;
