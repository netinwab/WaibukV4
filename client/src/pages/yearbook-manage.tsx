import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Upload, Plus, Trash2, Settings, Eye, BookOpen, FileText, Layers, Send as Publish, ChevronUp, ChevronDown, Edit } from "lucide-react";
import OrientationSelector from "@/components/ui/orientation-selector";

interface User {
  id: string;
  username: string;
  userType: "school" | "viewer" | "student";
  fullName: string;
}

interface School {
  id: string;
  name: string;
  yearFounded: number;
}

interface YearbookPage {
  id: string;
  yearbookId: string;
  pageNumber: number;
  title: string;
  imageUrl: string;
  pageType: "front_cover" | "back_cover" | "content";
  createdAt: Date;
}

interface TableOfContentsItem {
  id: string;
  yearbookId: string;
  title: string;
  pageNumber: number;
  description?: string;
  createdAt: Date;
}

interface Yearbook {
  id: string;
  schoolId: string;
  year: number;
  title: string;
  isPublished: boolean;
  frontCoverUrl?: string;
  backCoverUrl?: string;
  orientation?: string | null; // 'portrait', 'landscape', null (not selected)
  pages: YearbookPage[];
  tableOfContents: TableOfContentsItem[];
  createdAt: Date;
  publishedAt?: Date;
}

export default function YearbookManage() {
  const [, params] = useRoute("/yearbook-manage/:year");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const year = params?.year;
  const schoolId = new URLSearchParams(window.location.search).get("school");
  
  const [user, setUser] = useState<User | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showTOCDialog, setShowTOCDialog] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState<"front_cover" | "back_cover" | "content">("content");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [newTOCItem, setNewTOCItem] = useState({
    title: "",
    pageNumber: null as number | null,
    description: ""
  });
  
  // Track navigation history for back button
  const [hasNavigationHistory, setHasNavigationHistory] = useState(false);
  
  // Track unsaved changes (only for published yearbooks)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTOCItems, setPendingTOCItems] = useState<any[]>([]);
  const [pendingPageUploads, setPendingPageUploads] = useState<any[]>([]);
  
  // TOC editing state
  const [editingTOCId, setEditingTOCId] = useState<string | null>(null);
  const [editingTOCData, setEditingTOCData] = useState({
    title: "",
    pageNumber: 1,
    description: ""
  });
  
  // Orientation selection state
  const [showOrientationSelector, setShowOrientationSelector] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setLocation("/");
    }
    
    // Check if there's navigation history
    setHasNavigationHistory(window.history.length > 1);
  }, [setLocation]);

  const handleBackNavigation = () => {
    if (hasNavigationHistory) {
      window.history.back();
    }
  };

  // Fetch school data
  const { data: school } = useQuery<School>({
    queryKey: ["/api/schools", schoolId],
    enabled: !!schoolId,
  });

  // Fetch yearbook data
  const { data: yearbook, isLoading } = useQuery<Yearbook>({
    queryKey: ["/api/yearbooks", schoolId, year],
    enabled: !!schoolId && !!year,
    queryFn: async () => {
      const res = await fetch(`/api/yearbooks/${schoolId}/${year}`);
      if (!res.ok) {
        // If yearbook doesn't exist, create it
        if (res.status === 404) {
          const newYearbook = await apiRequest("POST", "/api/yearbooks", {
            schoolId,
            year: parseInt(year!),
            title: `${school?.name || 'School'} ${year} Yearbook`,
            isPublished: false
          });
          return newYearbook;
        }
        throw new Error("Failed to fetch yearbook");
      }
      return res.json();
    },
    retry: false, // Don't retry failed requests to avoid cache issues
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  // Check if orientation selector should be shown (after yearbook is defined)
  useEffect(() => {
    if (yearbook && yearbook.id && !yearbook.orientation) {
      setShowOrientationSelector(true);
    } else {
      setShowOrientationSelector(false);
    }
  }, [yearbook]);

  // Upload page mutation
  const uploadPageMutation = useMutation({
    mutationFn: async ({ file, pageType, title, yearbookId }: { file: File; pageType: string; title: string; yearbookId: string }) => {
      // For covers, always upload immediately to enable replacement, even for published yearbooks
      if (pageType === "front_cover" || pageType === "back_cover") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pageType", pageType);
        formData.append("title", title);
        
        const response = await fetch(`/api/yearbooks/${yearbookId}/upload-page`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error("Upload failed");
        return response.json();
      }
      
      // If yearbook is published, queue content pages for "Save Changes"
      if (yearbook?.isPublished) {
        // Create a local URL for immediate preview
        const tempUrl = URL.createObjectURL(file);
        setPendingPageUploads(prev => [...prev, { 
          file, 
          pageType, 
          title, 
          tempId: Date.now(),
          tempUrl, // Add temp URL for immediate preview
          pageNumber: pageType === "content" ? (yearbook?.pages?.filter(p => p.pageType === "content")?.length || 0) + prev.filter(p => p.pageType === "content").length + 1 : 0
        }]);
        setHasUnsavedChanges(true);
        return Promise.resolve({ tempId: Date.now() });
      }
      
      // For unpublished yearbooks, upload immediately
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pageType", pageType);
      formData.append("title", title);
      
      const response = await fetch(`/api/yearbooks/${yearbookId}/upload-page`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Always refresh UI when covers are uploaded (since they upload immediately)
      // For content pages, only refresh for unpublished yearbooks
      const isCover = variables.pageType === "front_cover" || variables.pageType === "back_cover";
      if (isCover || !yearbook?.isPublished) {
        queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      }
      
      const uploadType = isCover ? "Cover" : "Page";
      toast({ title: `${uploadType} uploaded successfully!` });
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      setShowUploadDialog(false);
      setUploadingFiles([]);
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Add table of contents item mutation
  const addTOCMutation = useMutation({
    mutationFn: async (tocData: typeof newTOCItem) => {
      // If yearbook is published, queue the change for "Save Changes"
      if (yearbook?.isPublished) {
        setPendingTOCItems(prev => [...prev, { ...tocData, tempId: Date.now() }]);
        setHasUnsavedChanges(true);
        return Promise.resolve({ tempId: Date.now() });
      }
      
      // For unpublished yearbooks, add immediately
      return apiRequest("POST", `/api/yearbooks/${yearbook?.id}/table-of-contents`, {
        ...tocData,
        yearbookId: yearbook?.id
      });
    },
    onSuccess: () => {
      if (!yearbook?.isPublished) {
        queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      }
      toast({ title: "Table of contents item added!" });
      setShowTOCDialog(false);
      setNewTOCItem({ title: "", pageNumber: null, description: "" });
    },
  });

  // Update TOC item mutation
  const updateTOCMutation = useMutation({
    mutationFn: async ({ tocId, updates }: { tocId: string, updates: any }) => {
      return apiRequest("PATCH", `/api/yearbooks/table-of-contents/${tocId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "Table of contents item updated!" });
      setEditingTOCId(null);
    },
    onError: () => {
      toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Delete TOC item mutation
  const deleteTOCMutation = useMutation({
    mutationFn: async (tocId: string) => {
      return apiRequest("DELETE", `/api/yearbooks/table-of-contents/${tocId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "Table of contents item deleted!" });
    },
    onError: () => {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Publish yearbook mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/yearbooks/${yearbook?.id}/publish`, {
        isPublished: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "Yearbook published successfully!", description: "Viewers can now access this yearbook." });
    },
    onError: () => {
      toast({ title: "Publish failed", description: "Please ensure you have uploaded front and back covers.", variant: "destructive" });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      // Get the page to be deleted to know its type and page number
      const allPages = yearbook?.pages || [];
      const deletedPage = allPages.find(p => p.id === pageId);
      
      // First delete the page
      await apiRequest("DELETE", `/api/yearbooks/pages/${pageId}`);
      
      // Only renumber if it was a content page (not covers)
      if (deletedPage && deletedPage.pageType === "content") {
        const contentPages = allPages.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber);
        const pagesToRenumber = contentPages.filter(p => p.pageNumber > deletedPage.pageNumber);
        
        // Renumber each page sequentially to close the gap
        for (const page of pagesToRenumber) {
          await apiRequest("PATCH", `/api/yearbooks/pages/${page.id}/reorder`, {
            pageNumber: page.pageNumber - 1
          });
        }
      }
      
      return pageId;
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      const allPages = yearbook?.pages || [];
      const deletedPage = allPages.find(p => p.id === pageId);
      const pageType = deletedPage?.pageType;
      
      if (pageType === "front_cover" || pageType === "back_cover") {
        const coverType = pageType === "front_cover" ? "Front cover" : "Back cover";
        toast({ title: `${coverType} deleted successfully!`, description: "You can upload a new one when ready." });
      } else {
        toast({ title: "Page deleted and pages renumbered!" });
      }
    },
    onError: () => {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Save changes mutation (for published yearbooks)
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      // Apply all pending page uploads
      for (const upload of pendingPageUploads) {
        const formData = new FormData();
        formData.append("file", upload.file);
        formData.append("pageType", upload.pageType);
        formData.append("title", upload.title);
        
        const response = await fetch(`/api/yearbooks/${yearbook?.id}/upload-page`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error(`Upload failed for ${upload.title}`);
      }
      
      // Apply all pending TOC items
      for (const tocItem of pendingTOCItems) {
        await apiRequest("POST", `/api/yearbooks/${yearbook?.id}/table-of-contents`, {
          ...tocItem,
          yearbookId: yearbook?.id
        });
      }
      
      return Promise.resolve();
    },
    onSuccess: () => {
      setPendingPageUploads([]);
      setPendingTOCItems([]);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "All changes saved successfully!" });
    },
    onError: (error) => {
      toast({ title: "Save failed", description: "Some changes could not be saved. Please try again.", variant: "destructive" });
    },
  });

  // Reorder page mutation
  const reorderPageMutation = useMutation({
    mutationFn: async ({ pageId, newPageNumber }: { pageId: string, newPageNumber: number }) => {
      return apiRequest("PATCH", `/api/yearbooks/pages/${pageId}/reorder`, {
        pageNumber: newPageNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "Page order updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to reorder page", description: "Please try again.", variant: "destructive" });
    },
  });

  // Update orientation mutation
  const updateOrientationMutation = useMutation({
    mutationFn: async (orientation: "portrait" | "landscape") => {
      if (!yearbook?.id) {
        throw new Error("Yearbook ID not available");
      }
      return apiRequest("PATCH", `/api/yearbooks/${yearbook.id}`, {
        orientation
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "Orientation set successfully!", description: "Your yearbook orientation has been configured." });
      setShowOrientationSelector(false);
    },
    onError: () => {
      toast({ title: "Failed to set orientation", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate file types - PDFs only allowed for content pages
      const invalidFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        // For covers, only allow images
        if (selectedPageType !== "content") {
          return !isImage;
        }
        
        // For content pages, allow both images and PDFs
        return !isImage && !isPDF;
      });
      
      if (invalidFiles.length > 0) {
        const allowedTypes = selectedPageType === "content" ? "images or PDFs" : "images only";
        toast({ 
          title: "Invalid file type", 
          description: `For ${selectedPageType === "content" ? "content pages" : "covers"}, please upload ${allowedTypes}.`, 
          variant: "destructive" 
        });
        // Reset file input
        event.target.value = '';
        return;
      }
      
      // For front/back covers, only allow single file
      if (selectedPageType !== "content" && files.length > 1) {
        toast({ title: "Multiple files not allowed", description: "Only one file allowed for covers.", variant: "destructive" });
        // Reset file input
        event.target.value = '';
        return;
      }
      
      setUploadingFiles(files);
    }
  };
  
  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (uploadingFiles.length === 0 || !yearbook?.id) return;
    
    // For single files (covers), upload normally
    if (uploadingFiles.length === 1) {
      const title = selectedPageType === "front_cover" ? "Front Cover" : 
                    selectedPageType === "back_cover" ? "Back Cover" : 
                    `Page ${(yearbook?.pages?.filter(p => p.pageType === "content")?.length || 0) + 1}`;
      
      uploadPageMutation.mutate({
        file: uploadingFiles[0],
        pageType: selectedPageType,
        title,
        yearbookId: yearbook.id
      });
    } else {
      // For multiple files, upload each one sequentially
      for (let i = 0; i < uploadingFiles.length; i++) {
        const file = uploadingFiles[i];
        const pageNumber = (yearbook?.pages?.filter(p => p.pageType === "content")?.length || 0) + i + 1;
        const title = `Page ${pageNumber}`;
        
        try {
          await new Promise((resolve, reject) => {
            uploadPageMutation.mutate({
              file,
              pageType: selectedPageType,
              title,
              yearbookId: yearbook.id
            }, {
              onSuccess: resolve,
              onError: reject
            });
          });
        } catch (error) {
          toast({ title: "Upload failed", description: `Failed to upload ${file.name}`, variant: "destructive" });
          break;
        }
      }
    }
  };

  const handleAddTOC = () => {
    addTOCMutation.mutate(newTOCItem);
  };

  // Drag and drop state
  const [draggedPage, setDraggedPage] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageNumber, setEditPageNumber] = useState<string>("");
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Reorder page functions
  const handleReorderPage = (pageId: string, direction: 'up' | 'down') => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    const currentPage = contentPages.find(p => p.id === pageId);
    
    if (!currentPage) return;
    
    const currentIndex = contentPages.findIndex(p => p.id === pageId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetPage = contentPages[currentIndex - 1];
      // Swap page numbers
      reorderPageMutation.mutate({ pageId: currentPage.id, newPageNumber: targetPage.pageNumber });
      reorderPageMutation.mutate({ pageId: targetPage.id, newPageNumber: currentPage.pageNumber });
    } else if (direction === 'down' && currentIndex < contentPages.length - 1) {
      const targetPage = contentPages[currentIndex + 1];
      // Swap page numbers
      reorderPageMutation.mutate({ pageId: currentPage.id, newPageNumber: targetPage.pageNumber });
      reorderPageMutation.mutate({ pageId: targetPage.id, newPageNumber: currentPage.pageNumber });
    }
  };

  // Page number editing function
  const handlePageNumberEdit = (pageId: string) => {
    const newPageNumber = parseInt(editPageNumber);
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    
    // Validation
    if (isNaN(newPageNumber) || newPageNumber < 1 || newPageNumber > contentPages.length) {
      toast({ 
        title: "Invalid page number", 
        description: `Please enter a number between 1 and ${contentPages.length}`,
        variant: "destructive"
      });
      setEditingPageId(null);
      setEditPageNumber("");
      return;
    }
    
    const currentPage = contentPages.find(p => p.id === pageId);
    const targetPage = contentPages.find(p => p.pageNumber === newPageNumber);
    
    if (currentPage && targetPage && currentPage.id !== targetPage.id) {
      // Swap page numbers
      reorderPageMutation.mutate({ pageId: currentPage.id, newPageNumber: targetPage.pageNumber });
      reorderPageMutation.mutate({ pageId: targetPage.id, newPageNumber: currentPage.pageNumber });
      toast({ title: `Page ${currentPage.pageNumber} moved to position ${newPageNumber}` });
    }
    
    setEditingPageId(null);
    setEditPageNumber("");
  };

  // Update page numbering mutation - renumbers all pages sequentially
  const updateNumberingMutation = useMutation({
    mutationFn: async () => {
      const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
      
      // Renumber all pages sequentially starting from 1
      for (let i = 0; i < contentPages.length; i++) {
        const page = contentPages[i];
        const newPageNumber = i + 1;
        
        if (page.pageNumber !== newPageNumber) {
          await apiRequest("PATCH", `/api/yearbooks/pages/${page.id}/reorder`, {
            pageNumber: newPageNumber
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "Page numbering updated successfully!" });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Handle update page numbering button click
  const handleUpdatePageNumbering = () => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    
    if (contentPages.length === 0) {
      toast({ title: "No content pages to renumber", variant: "destructive" });
      return;
    }

    // Check if renumbering is needed
    const needsRenumbering = contentPages.some((page, index) => page.pageNumber !== index + 1);
    
    if (!needsRenumbering) {
      toast({ title: "Page numbering is already correct" });
      return;
    }

    updateNumberingMutation.mutate();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPage(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', pageId);
  };

  const handleDragEnd = () => {
    setDraggedPage(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedPage) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Simple approach - just clear the drag over state
    // The onDragOver will set it again if still over a valid target
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedPageId = e.dataTransfer.getData('text/html');
    
    if (!draggedPageId || !draggedPage) return;
    
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    const currentIndex = contentPages.findIndex(p => p.id === draggedPageId);
    
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    const currentPage = contentPages[currentIndex];
    const targetPage = contentPages[targetIndex];
    
    // Simple swap - always swap the two pages' positions
    if (currentPage && targetPage) {
      reorderPageMutation.mutate({ pageId: currentPage.id, newPageNumber: targetPage.pageNumber });
      reorderPageMutation.mutate({ pageId: targetPage.id, newPageNumber: currentPage.pageNumber });
      toast({ title: `Page ${currentPage.pageNumber} swapped with page ${targetPage.pageNumber}!` });
    }

    setDraggedPage(null);
    setDragOverIndex(null);
  };

  const canPublish = yearbook?.pages?.some(p => p.pageType === "front_cover") && 
                    yearbook?.pages?.some(p => p.pageType === "back_cover");

  if (!user || user.userType !== "school") {
    return <div className="p-4">Access denied. School administrators only.</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading yearbook...</div>;
  }

  // Show orientation selector if orientation is not set
  if (showOrientationSelector && yearbook) {
    return (
      <OrientationSelector
        onOrientationSelect={(orientation) => updateOrientationMutation.mutate(orientation)}
        loading={updateOrientationMutation.isPending}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Main Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-20 animate-float-delayed"></div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen bg-white/95 backdrop-blur-sm">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-sm border-b border-gray-200 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 left-10 w-8 h-8 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute top-3 right-20 w-6 h-6 bg-white rounded-full opacity-5 animate-float-delayed"></div>
            <div className="absolute bottom-2 left-20 w-5 h-5 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute bottom-1 right-10 w-4 h-4 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <div className="hidden sm:flex items-center">
                <Button
                  variant="ghost"
                  onClick={handleBackNavigation}
                  disabled={!hasNavigationHistory}
                  className="mr-2 text-white hover:bg-white/20"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/school-dashboard?tab=years")}
                  className="mr-4 text-white hover:bg-white/20"
                  data-testid="button-back-to-dashboard"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              
              {/* Mobile back button */}
              <Button
                variant="ghost"
                onClick={() => setLocation("/school-dashboard?tab=years")}
                className="sm:hidden mr-2 text-white hover:bg-white/20"
                size="sm"
                data-testid="button-mobile-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="text-white text-sm" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg sm:text-xl font-semibold text-white">
                  <span className="hidden sm:inline">Yearbook Manager - </span>
                  <span className="sm:hidden">Yearbook - </span>
                  {school?.name} {year}
                </h1>
                <p className="text-sm text-white/80">
                  {yearbook?.isPublished ? "Published" : "Draft"} • {yearbook?.pages?.length || 0} pages
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-orange-300">• Unsaved changes</span>
                  )}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Table of Contents */}
          <div className="w-full lg:w-80 bg-white rounded-lg shadow p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Table of Contents</h3>
              <Button
                size="sm"
                onClick={() => setShowTOCDialog(true)}
                data-testid="button-add-toc-item"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* Existing TOC items */}
              {yearbook?.tableOfContents?.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  {editingTOCId === item.id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <Input
                        value={editingTOCData.title}
                        onChange={(e) => setEditingTOCData({ ...editingTOCData, title: e.target.value })}
                        placeholder="Title"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={editingTOCData.pageNumber}
                          onChange={(e) => setEditingTOCData({ ...editingTOCData, pageNumber: parseInt(e.target.value) || 1 })}
                          className="text-xs w-20"
                        />
                        <Input
                          value={editingTOCData.description}
                          onChange={(e) => setEditingTOCData({ ...editingTOCData, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="text-xs flex-1"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateTOCMutation.mutate({ tocId: item.id, updates: editingTOCData });
                          }}
                          disabled={!editingTOCData.title || updateTOCMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTOCId(null);
                            setEditingTOCData({ title: "", pageNumber: 1, description: "" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">Content Page {item.pageNumber}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTOCId(item.id);
                            setEditingTOCData({
                              title: item.title,
                              pageNumber: item.pageNumber,
                              description: item.description || ""
                            });
                          }}
                          className="p-1 h-6 w-6"
                          title="Edit item"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTOCMutation.mutate(item.id)}
                          disabled={deleteTOCMutation.isPending}
                          className="p-1 h-6 w-6"
                          title="Delete item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Pending TOC items (for published yearbooks) */}
              {pendingTOCItems.map((item) => (
                <div key={item.tempId} className="p-3 border-2 border-orange-300 rounded-lg bg-orange-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-orange-600">Content Page {item.pageNumber} (Pending)</p>
                      {item.description && (
                        <p className="text-xs text-orange-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingTOCItems(prev => prev.filter(p => p.tempId !== item.tempId));
                        if (pendingTOCItems.length === 1 && pendingPageUploads.length === 0) {
                          setHasUnsavedChanges(false);
                        }
                      }}
                      className="p-1 h-6 w-6 ml-2"
                      title="Remove pending item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!yearbook?.tableOfContents || yearbook.tableOfContents.length === 0) && pendingTOCItems.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No items added yet</p>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Yearbook Pages</h2>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setSelectedPageType("content");
                        setShowUploadDialog(true);
                      }}
                      data-testid="button-add-page"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Page
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cover Pages */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* Front Cover */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="mb-3">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="font-medium text-gray-900">Front Cover</h3>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    
                    {yearbook?.pages?.find(p => p.pageType === "front_cover") ? (
                      <div>
                        <img
                          src={yearbook.pages.find(p => p.pageType === "front_cover")?.imageUrl}
                          alt="Front Cover"
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const frontCover = yearbook.pages.find(p => p.pageType === "front_cover");
                              if (frontCover) {
                                deletePageMutation.mutate(frontCover.id);
                              }
                            }}
                            data-testid="button-delete-front-cover"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedPageType("front_cover");
                          setShowUploadDialog(true);
                        }}
                        data-testid="button-upload-front-cover"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Front Cover
                      </Button>
                    )}
                  </div>

                  {/* Back Cover */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="mb-3">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="font-medium text-gray-900">Back Cover</h3>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    
                    {yearbook?.pages?.find(p => p.pageType === "back_cover") ? (
                      <div>
                        <img
                          src={yearbook.pages.find(p => p.pageType === "back_cover")?.imageUrl}
                          alt="Back Cover"
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const backCover = yearbook.pages.find(p => p.pageType === "back_cover");
                              if (backCover) {
                                deletePageMutation.mutate(backCover.id);
                              }
                            }}
                            data-testid="button-delete-back-cover"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedPageType("back_cover");
                          setShowUploadDialog(true);
                        }}
                        data-testid="button-upload-back-cover"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Back Cover
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content Pages */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Content Pages</h3>
                  
                  {/* Drag and Drop Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-700 mb-1 font-medium">Page Organization</p>
                    <p className="text-xs text-blue-600">
                      Drag and drop pages to reorder: Drop on adjacent pages to swap positions, or drop on distant pages to insert between them.
                      Hold Ctrl while dropping to force insertion mode.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Existing saved content pages */}
                    {yearbook?.pages?.filter(p => p.pageType === "content")
                      .sort((a, b) => a.pageNumber - b.pageNumber)
                      .map((page, index, sortedPages) => (
                      <div 
                        key={page.id} 
                        className={`border rounded-lg p-4 transition-all duration-200 cursor-move
                          ${draggedPage === page.id ? 'opacity-50 scale-95' : ''}
                          ${dragOverIndex === index ? 'border-blue-400 bg-blue-50 scale-105' : 'hover:shadow-md'}
                        `}
                        draggable
                        onDragStart={(e) => handleDragStart(e, page.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        data-testid={`page-item-${page.id}`}
                      >
                        {/* Drag Handle */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-2 gap-0.5 cursor-grab active:cursor-grabbing">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                            {editingPageId === page.id ? (
                              <input
                                type="number"
                                value={editPageNumber}
                                onChange={(e) => setEditPageNumber(e.target.value)}
                                onBlur={() => handlePageNumberEdit(page.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handlePageNumberEdit(page.id);
                                  if (e.key === 'Escape') {
                                    setEditingPageId(null);
                                    setEditPageNumber("");
                                  }
                                }}
                                className="w-12 h-5 text-xs border rounded px-1 text-center"
                                autoFocus
                                min="1"
                                data-testid={`input-page-number-${page.id}`}
                              />
                            ) : (
                              <span 
                                className="text-xs font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                                onClick={() => {
                                  setEditingPageId(page.id);
                                  setEditPageNumber(page.pageNumber.toString());
                                }}
                                title="Click to edit page number"
                              >
                                Page {page.pageNumber}
                              </span>
                            )}
                          </div>
                          
                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReorderPage(page.id, 'up');
                              }}
                              disabled={index === 0 || reorderPageMutation.isPending}
                              className="p-1 h-6 w-6 opacity-60 hover:opacity-100"
                              data-testid={`button-move-up-${page.id}`}
                              title="Move up"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReorderPage(page.id, 'down');
                              }}
                              disabled={index === sortedPages.length - 1 || reorderPageMutation.isPending}
                              className="p-1 h-6 w-6 opacity-60 hover:opacity-100"
                              data-testid={`button-move-down-${page.id}`}
                              title="Move down"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <img
                          src={page.imageUrl}
                          alt={page.title}
                          className="w-full h-32 object-cover rounded mb-2 pointer-events-none"
                        />
                        <p className="text-sm font-medium truncate">{page.title}</p>
                        
                        {/* Action buttons */}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">Drag to reorder</span>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPageId(page.id);
                                setShowPreviewDialog(true);
                              }}
                              className="p-1 h-6 w-6"
                              title="Preview page"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePageMutation.mutate(page.id);
                              }}
                              className="p-1 h-6 w-6"
                              title="Delete page"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pending content pages (for immediate preview) */}
                    {pendingPageUploads.filter(p => p.pageType === "content").map((pendingPage) => (
                      <div key={pendingPage.tempId} className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                        <img
                          src={pendingPage.tempUrl}
                          alt={pendingPage.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <p className="text-sm font-medium truncate">{pendingPage.title}</p>
                        <p className="text-xs text-orange-600">Page {pendingPage.pageNumber} (Pending)</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-orange-600 font-medium">Unsaved</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setPendingPageUploads(prev => prev.filter(p => p.tempId !== pendingPage.tempId));
                              URL.revokeObjectURL(pendingPage.tempUrl); // Clean up temp URL
                              if (pendingPageUploads.length === 1) setHasUnsavedChanges(false);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Page Button */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedPageType("content");
                          setShowUploadDialog(true);
                        }}
                        className="flex flex-col items-center"
                      >
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Add Page</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Operations */}
          <div className="w-64 bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Publishing Checklist</h3>
            
            {/* Publishing Requirements Checklist */}
            <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  yearbook?.pages?.some(p => p.pageType === "front_cover") ? "bg-green-500" : "bg-gray-300"
                }`}>
                  {yearbook?.pages?.some(p => p.pageType === "front_cover") && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm ${
                  yearbook?.pages?.some(p => p.pageType === "front_cover") ? "text-green-700" : "text-gray-600"
                }`}>
                  Front cover uploaded
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  yearbook?.pages?.some(p => p.pageType === "back_cover") ? "bg-green-500" : "bg-gray-300"
                }`}>
                  {yearbook?.pages?.some(p => p.pageType === "back_cover") && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm ${
                  yearbook?.pages?.some(p => p.pageType === "back_cover") ? "text-green-700" : "text-gray-600"
                }`}>
                  Back cover uploaded
                </span>
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {canPublish 
                    ? "✓ Ready to publish! Viewers can access after publishing." 
                    : "Upload both covers to enable publishing."
                  }
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  if (yearbook?.isPublished) {
                    saveChangesMutation.mutate();
                  } else {
                    publishMutation.mutate();
                  }
                }}
                disabled={yearbook?.isPublished ? 
                  (!hasUnsavedChanges || saveChangesMutation.isPending) : 
                  (!canPublish || publishMutation.isPending)
                }
                data-testid="button-publish-yearbook"
              >
                <Publish className="h-4 w-4 mr-2" />
                {yearbook?.isPublished ? 
                  (hasUnsavedChanges ? "Save Changes" : "Saved") : 
                  "Publish Yearbook"
                }
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Open preview in new tab
                  const previewUrl = `/waibuk/${year}?school=${schoolId}&preview=true`;
                  window.open(previewUrl, '_blank');
                }}
                disabled={!yearbook || !yearbook.pages || yearbook.pages.length === 0}
                data-testid="button-preview-yearbook"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Add settings functionality
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleUpdatePageNumbering}
                disabled={!yearbook?.pages?.some(p => p.pageType === "content") || updateNumberingMutation.isPending}
                data-testid="button-update-page-numbering"
              >
                <Layers className="h-4 w-4 mr-2" />
                {updateNumberingMutation.isPending ? "Updating..." : "Update Page Numbering"}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pages:</span>
                  <span>{yearbook?.pages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TOC Items:</span>
                  <span>{yearbook?.tableOfContents?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={yearbook?.isPublished ? "text-green-600" : "text-orange-600"}>
                    {yearbook?.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) {
          // Reset file input and uploading files when dialog closes
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          setUploadingFiles([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload {selectedPageType === "front_cover" ? "Front Cover" : 
                      selectedPageType === "back_cover" ? "Back Cover" : "Content Page"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">
                Select {selectedPageType === "content" ? "Image or PDF File" : "Image File"}{selectedPageType === "content" ? "s (multiple allowed)" : ""}
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept={selectedPageType === "content" ? "image/*,.pdf" : "image/*"}
                multiple={selectedPageType === "content"}
                onChange={handleFileUpload}
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedPageType === "content" 
                  ? "You can select multiple images or PDFs for content pages. They will be uploaded in sequence."
                  : "Please upload portrait orientation images only. Recommended resolution: 1200x1600px"
                }
              </p>
            </div>
            
            {uploadingFiles.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeUploadingFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadSubmit}
                disabled={uploadingFiles.length === 0 || uploadPageMutation.isPending}
              >
                {uploadPageMutation.isPending ? "Uploading..." : `Upload ${uploadingFiles.length > 1 ? `${uploadingFiles.length} Files` : "File"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table of Contents Dialog */}
      <Dialog open={showTOCDialog} onOpenChange={setShowTOCDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table of Contents Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="toc-title">Title</Label>
              <Input
                id="toc-title"
                value={newTOCItem.title}
                onChange={(e) => setNewTOCItem({ ...newTOCItem, title: e.target.value })}
                placeholder="e.g., Principal's Message, Class of 2024"
              />
            </div>
            
            <div>
              <Label htmlFor="toc-page">Content Page Number</Label>
              <Input
                id="toc-page"
                type="number"
                min="1"
                max={yearbook?.pages?.filter(p => p.pageType === "content")?.length || 1}
                value={newTOCItem.pageNumber || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewTOCItem({ 
                    ...newTOCItem, 
                    pageNumber: value === "" ? null : parseInt(value) || null 
                  });
                }}
                placeholder="Enter content page number"
              />
              {!newTOCItem.pageNumber && (
                <p className="text-xs text-gray-500 mt-1">Content page number is required</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Page numbers refer to content pages only (covers are not counted)
              </p>
            </div>
            
            <div>
              <Label htmlFor="toc-description">Description (Optional)</Label>
              <Input
                id="toc-description"
                value={newTOCItem.description}
                onChange={(e) => setNewTOCItem({ ...newTOCItem, description: e.target.value })}
                placeholder="Brief description of this section"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTOCDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddTOC}
                disabled={!newTOCItem.title || !newTOCItem.pageNumber || addTOCMutation.isPending}
              >
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Page Preview</DialogTitle>
          </DialogHeader>
          {previewPageId && (() => {
            const previewPage = yearbook?.pages?.find(p => p.id === previewPageId);
            return previewPage ? (
              <div className="flex justify-center">
                <div className="border border-gray-300 shadow-lg">
                  <img
                    src={previewPage.imageUrl}
                    alt={previewPage.title}
                    className="max-w-full max-h-96 object-contain"
                  />
                  <div className="p-3 bg-gray-50">
                    <p className="text-sm font-medium">{previewPage.title}</p>
                    {previewPage.pageType === "content" && (
                      <p className="text-xs text-gray-500">Page {previewPage.pageNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Page not found</p>
            );
          })()}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}