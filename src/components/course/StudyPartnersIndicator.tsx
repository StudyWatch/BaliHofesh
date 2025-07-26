
import React from 'react';
import { Users } from 'lucide-react';
import { useStudyPartners } from '@/hooks/useStudyPartners';

interface StudyPartnersIndicatorProps {
  courseId: string;
}

const StudyPartnersIndicator = ({ courseId }: StudyPartnersIndicatorProps) => {
  const { data: partners } = useStudyPartners(courseId);
  
  const activePartnersCount = partners?.length || 0;

  if (activePartnersCount === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
      <Users className="w-3 h-3" />
      <span>{activePartnersCount} מחכים ללימוד משותף</span>
    </div>
  );
};

export default StudyPartnersIndicator;
