
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourseGroups } from '@/hooks/useCourseGroups';
import whatsappIcon from '@/assets/whatsapp-icon.svg';
import discordIcon from '@/assets/discord-icon.png';

interface CourseGroupsProps {
  courseId: string;
}

const CourseGroups = ({ courseId }: CourseGroupsProps) => {
  const { data: courseGroups } = useCourseGroups(courseId);

  if (!courseGroups || (!courseGroups.whatsapp_link && !courseGroups.discord_link)) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-right">קבוצות קורס</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          {courseGroups.whatsapp_link && (
            <Button
              asChild
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1da851] text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <a href={courseGroups.whatsapp_link} target="_blank" rel="noopener noreferrer">
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                <span className="font-medium">קבוצת WhatsApp</span>
              </a>
            </Button>
          )}
          {courseGroups.discord_link && (
            <Button
              asChild
              className="flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <a href={courseGroups.discord_link} target="_blank" rel="noopener noreferrer">
                <img src={discordIcon} alt="Discord" className="w-5 h-5" />
                <span className="font-medium">שרת Discord</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseGroups;
