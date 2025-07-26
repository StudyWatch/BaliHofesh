import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Edit, 
  MapPin, 
  GraduationCap, 
  Calendar,
  Camera,
  Award,
  Star
} from 'lucide-react';
import { UserProfile } from '@/hooks/useProfile';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEditClick }) => {
  // Calculate profile completion percentage
  const profileFields = [
    profile.name,
    profile.bio,
    profile.avatar_url,
    profile.university,
    profile.study_year,
    profile.location,
    profile.phone
  ];
  const completedFields = profileFields.filter(field => field && field.trim()).length;
  const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
      
      {/* Content */}
      <div className="relative p-8 text-center">
        {/* Profile Picture with Upload */}
        <div className="relative inline-block mb-6">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
              <AvatarImage src={profile.avatar_url} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-secondary text-white">
                {profile.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Achievement Badge */}
          {completionPercentage >= 80 && (
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full p-2 shadow-lg animate-pulse">
              <Award className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Name and Bio */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            {profile.name}
            {completionPercentage === 100 && (
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
            )}
          </h1>
          {profile.bio && (
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Info Badges */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {profile.university && (
            <Badge variant="secondary" className="px-4 py-2 text-sm flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
              <GraduationCap className="w-4 h-4" />
              {profile.university}
            </Badge>
          )}
          {profile.study_year && (
            <Badge variant="outline" className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors">
              <Calendar className="w-4 h-4" />
              {profile.study_year}
            </Badge>
          )}
          {profile.location && (
            <Badge variant="outline" className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </Badge>
          )}
        </div>

        {/* Profile Completion */}
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">השלמת פרופיל</span>
              <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-3 mb-2" 
            />
            {completionPercentage < 100 && (
              <p className="text-xs text-muted-foreground">
                השלם את הפרטים החסרים כדי להגדיל את הנראות שלך
              </p>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <Button
          onClick={onEditClick}
          size="lg"
          className="px-8 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Edit className="w-5 h-5 mr-2" />
          עריכת פרופיל
        </Button>
      </div>
    </Card>
  );
};

export default ProfileHeader;