"use client";

import { useState } from 'react';
import { apiService } from '@/app/services/apiService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface UserForPfp {
  user_id: string;
}

interface ProfilePictureUploadModalProps {
  user: UserForPfp;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export function ProfilePictureUploadModal({ user, isOpen, onClose, onUpdate }: ProfilePictureUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await apiService.uploadProfilePicture(user.user_id, selectedFile);
      toast({ title: "Success", description: "Profile picture uploaded." });
      onUpdate(updatedUser);
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "An unexpected error occurred.";
      setError(errorMsg);
      toast({ variant: "destructive", title: "Upload Failed", description: errorMsg });
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };
  
  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const updatedUser = await apiService.deleteProfilePicture(user.user_id);
        toast({ title: "Success", description: "Profile picture removed." });
        onUpdate(updatedUser);
        onClose();
    } catch (err: any) {
        const errorMsg = err.response?.data?.detail || "An unexpected error occurred.";
        setError(errorMsg);
        toast({ variant: "destructive", title: "Delete Failed", description: errorMsg });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a professional photo (JPEG/PNG, max 5MB).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="picture"
            type="file"
            accept=".png, .jpg, .jpeg"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter className="sm:justify-between">
           <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Removing..." : "Remove Picture"}
           </Button>
           <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
            {isLoading ? "Uploading..." : "Upload & Save"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
