import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import NotificationSettings from './NotificationSettings';

interface NotificationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  open,
  onClose,
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-md w-[95vw] sm:w-[420px] p-0 rounded-xl shadow-xl">
      <DialogHeader className="px-6 pt-5 pb-1 border-b bg-white dark:bg-zinc-900">
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          הגדרות התראות
        </DialogTitle>
        <DialogClose className="absolute left-5 top-5 text-2xl text-gray-400 hover:text-gray-700 transition">×</DialogClose>
      </DialogHeader>
      <div className="max-h-[74vh] overflow-y-auto px-6 pb-6 bg-white dark:bg-zinc-900">
        <NotificationSettings onClose={onClose} />
      </div>
    </DialogContent>
  </Dialog>
);

export default NotificationSettingsDialog;
