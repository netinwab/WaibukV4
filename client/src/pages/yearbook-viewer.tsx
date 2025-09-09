import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function YearbookViewer() {
  const [, setLocation] = useLocation();
  const [year, setYear] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Extract year from URL path
    const pathParts = window.location.pathname.split('/');
    const yearFromPath = pathParts[pathParts.length - 1];
    setYear(yearFromPath);
    
    // Extract school ID from query params
    const params = new URLSearchParams(window.location.search);
    const schoolIdFromQuery = params.get('school');
    if (schoolIdFromQuery) {
      setSchoolId(schoolIdFromQuery);
    }
  }, []);

  const handleBack = () => {
    setLocation("/school-dashboard");
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 500));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const totalPages = 120; // Mock total pages

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yearbook {year}</h1>
              <p className="text-sm text-gray-600">School ID: {schoolId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoomLevel}%
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleZoomIn}
                disabled={zoomLevel >= 500}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Download Button */}
            <Button className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Yearbook Viewer</span>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* PDF Placeholder */}
            <div 
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto shadow-md"
              style={{ 
                width: `${Math.floor(8.5 * 96 * (zoomLevel / 100))}px`, 
                height: `${Math.floor(11 * 96 * (zoomLevel / 100))}px`,
                maxWidth: '100%'
              }}
            >
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-6">
                  <RotateCw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    PDF Viewer Placeholder
                  </h3>
                  <p className="text-gray-500 mb-4">
                    This is where the yearbook PDF for {year} would be displayed.
                  </p>
                </div>
                
                {/* Mock Content Preview */}
                <div className="w-full max-w-md space-y-4">
                  <div className="bg-gray-100 rounded p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Page {currentPage} Content</h4>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-20 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    In a real implementation, this would integrate with a PDF viewer library
                    like react-pdf or pdf.js to display the actual yearbook pages.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}