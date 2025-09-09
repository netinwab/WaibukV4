import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FolderOpen, HardDrive, Images, Video, X, FileImage, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Form schema for memory upload
const memoryUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(['graduation', 'sports', 'arts', 'field_trips', 'academic']),
  file: z.instanceof(File).refine((file) => file.size <= 20 * 1024 * 1024, "File must be less than 20MB")
});

type MemoryUploadForm = z.infer<typeof memoryUploadSchema>;

export default function PhotosMemoriesManage() {
  const [, setLocation] = useLocation();
  const [year, setYear] = useState<string>("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<MemoryUploadForm>({
    resolver: zodResolver(memoryUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "graduation"
    }
  });

  useEffect(() => {
    // Extract year and schoolId from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('year');
    const schoolParam = urlParams.get('school');
    
    if (yearParam) setYear(yearParam);
    if (schoolParam) setSchoolId(schoolParam);
  }, []);

  const handleBackToSchool = () => {
    setLocation("/school-dashboard");
  };

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Update form with file
      form.setValue('file', file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    form.setValue('file', undefined as any);
  };

  // Fetch existing memories for the year
  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['/api/memories/school', schoolId, year],
    enabled: !!schoolId && !!year,
    queryFn: async () => {
      const response = await fetch(`/api/memories/school/${schoolId}/${year}`);
      if (!response.ok) throw new Error('Failed to fetch memories');
      return response.json();
    }
  });

  // Memory upload mutation
  const uploadMemoryMutation = useMutation({
    mutationFn: async (data: MemoryUploadForm) => {
      if (!schoolId || !year) throw new Error('Missing school ID or year');
      
      const formData = new FormData();
      formData.append('memoryFile', data.file);
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('eventDate', year); // Use year as event date
      formData.append('year', year);
      formData.append('category', data.category);
      formData.append('schoolId', schoolId);

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload memory');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Memory uploaded successfully!",
        description: "Your photo/video has been added to the yearbook."
      });
      
      // Reset form
      form.reset();
      handleRemoveFile();
      
      // Refetch memories
      queryClient.invalidateQueries({ queryKey: ['/api/memories/school', schoolId, year] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload memory",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: MemoryUploadForm) => {
    uploadMemoryMutation.mutate(data);
  };

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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleBackToSchool}
                className="text-white border-white/50 hover:bg-white/10 hover:text-white bg-white/10"
                data-testid="button-back-to-school"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to School Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Photos & Memories Management
                </h1>
                <p className="text-white/80">
                  {year ? `Managing Year ${year}` : "Manage photos and memories"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Storage Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="h-5 w-5 mr-2" />
                Storage Usage for Year {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Used Storage:</span>
                  <span className="text-sm font-medium">0 MB / 20 MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-gray-500">
                  Each year has a 20MB storage limit for photos and memories.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Memory Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Images className="h-5 w-5 mr-2" />
                Memory Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Graduation</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-700">Sports</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-700">Arts</p>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <p className="text-sm font-medium text-pink-700">Field Trips</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Academic</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {!selectedFile ? (
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="mb-4">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-lg font-medium text-gray-900">Upload photo or video</span>
                            <br />
                            <span className="text-sm text-gray-600">
                              Drag and drop or click to select (Max 20MB)
                            </span>
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            data-testid="input-file"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Supported formats: JPG, PNG, MP4, MOV, etc.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {selectedFile.type.startsWith('image/') ? (
                              <FileImage className="h-8 w-8 text-blue-600" />
                            ) : (
                              <FileVideo className="h-8 w-8 text-purple-600" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-sm text-gray-600">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRemoveFile}
                            data-testid="button-remove-file"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {selectedFile.type.startsWith('image/') && (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg mx-auto" 
                          />
                        )}
                        
                        {selectedFile.type.startsWith('video/') && (
                          <video 
                            src={previewUrl} 
                            controls 
                            className="max-h-48 rounded-lg mx-auto" 
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title Field */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Graduation Day 2024" 
                            {...field} 
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category Field */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select memory category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="graduation">Graduation</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="arts">Arts</SelectItem>
                            <SelectItem value="field_trips">Field Trips</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add details about this memory..." 
                            className="resize-none" 
                            rows={3} 
                            {...field} 
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!selectedFile || uploadMemoryMutation.isPending}
                      data-testid="button-upload-memory"
                    >
                      {uploadMemoryMutation.isPending ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Memory
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Existing Memories */}
          {memories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Uploaded Memories ({memories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {memories.map((memory: any) => (
                    <div 
                      key={memory.id} 
                      className="group relative aspect-square rounded-lg overflow-hidden border"
                    >
                      {memory.mediaType === 'image' ? (
                        <img 
                          src={memory.imageUrl} 
                          alt={memory.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-end p-2">
                        <div className="text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="text-sm font-medium truncate">{memory.title}</p>
                          <p className="text-xs opacity-80 capitalize">{memory.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}