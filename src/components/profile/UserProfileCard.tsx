
import React, { useState } from 'react';
import { 
  useUserProfile, 
  useUserFavoriteCourses, 
  useUserActivePartnerships, 
  useUserActiveSessions,
  useProfileStats 
} from '@/hooks/useProfile';
import ProfileEditDialog from './ProfileEditDialog';
import ProfileHeader from './ProfileHeader';
import FavoriteCoursesSection from './FavoriteCoursesSection';
import QuickActionsCard from './QuickActionsCard';
import ActivityStatsCard from './ActivityStatsCard';
import { toast } from 'sonner';

const UserProfileCard = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { data: profile, isLoading } = useUserProfile();
  const { data: favoriteCourses } = useUserFavoriteCourses();
  const { data: partnerships } = useUserActivePartnerships();
  const { data: sessions } = useUserActiveSessions();
  const { data: stats } = useProfileStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">לא ניתן לטעון את הפרופיל</p>
      </div>
    );
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'calendar':
        toast.info('פתיחת לוח השנה...');
        break;
      case 'study-partners':
        toast.info('חיפוש שותפי לימוד...');
        break;
      case 'messages':
        toast.info('פתיחת הודעות...');
        break;
      case 'sessions':
        toast.info('צפייה במפגשי לימוד...');
        break;
      case 'notifications':
        toast.info('פתיחת הגדרות התראות...');
        break;
      case 'settings':
        toast.info('פתיחת הגדרות...');
        break;
      default:
        toast.info(`פעולה: ${action}`);
    }
  };

  const handleAddCourse = () => {
    toast.info('הוספת קורס חדש...');
  };

  const handleViewAllCourses = () => {
    toast.info('צפייה בכל הקורסים...');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader 
        profile={profile}
        onEditClick={() => setIsEditOpen(true)}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <FavoriteCoursesSection
            courses={favoriteCourses || []}
            onAddCourse={handleAddCourse}
            onViewAll={handleViewAllCourses}
          />
          
          {/* Recent Activity - Mobile Only */}
          <div className="lg:hidden">
            <ActivityStatsCard stats={stats} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard onActionClick={handleQuickAction} />
          
          {/* Stats - Desktop Only */}
          <div className="hidden lg:block">
            <ActivityStatsCard stats={stats} />
          </div>
        </div>
      </div>

      <ProfileEditDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </div>
  );
};

export default UserProfileCard;
