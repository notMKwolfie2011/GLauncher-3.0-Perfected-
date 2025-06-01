import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameFile } from "@shared/schema";

export function useFiles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: files,
    isLoading: isLoadingFiles,
    error: filesError
  } = useQuery<GameFile[]>({
    queryKey: ["/api/files"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      // Use fetch directly for file upload instead of apiRequest
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File uploaded successfully",
        description: `${data.originalName} has been uploaded and is ready to play.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/files/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "File has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/files");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "All files cleared",
        description: "All uploaded files have been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clear failed",
        description: error.message || "Failed to clear files. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    files,
    isLoading: isLoadingFiles || uploadMutation.isPending || deleteMutation.isPending || clearAllMutation.isPending,
    error: filesError,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    clearAllFiles: clearAllMutation.mutate,
  };
}
