import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Tablet } from "lucide-react";

interface OrientationSelectorProps {
  onOrientationSelect: (orientation: "portrait" | "landscape") => void;
  loading?: boolean;
}

export default function OrientationSelector({ onOrientationSelect, loading = false }: OrientationSelectorProps) {
  const [selectedOrientation, setSelectedOrientation] = useState<"portrait" | "landscape" | null>(null);

  const handleOrientationSelect = (orientation: "portrait" | "landscape") => {
    setSelectedOrientation(orientation);
  };

  const handleConfirm = () => {
    if (selectedOrientation) {
      onOrientationSelect(selectedOrientation);
    }
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
      <div className="relative z-10 min-h-screen bg-white/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl" data-testid="card-orientation-selector">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground mb-4" data-testid="title-orientation-selector">
            Choose Yearbook Orientation
          </CardTitle>
          <p className="text-muted-foreground text-lg" data-testid="text-orientation-description">
            Selecting this orientation will help the PDF viewer optimize display for your yearbook pages.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Portrait Option */}
            <div 
              className={`cursor-pointer transition-all duration-200 ${
                selectedOrientation === "portrait" 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                  : "hover:shadow-lg"
              }`}
              onClick={() => handleOrientationSelect("portrait")}
              data-testid="option-portrait"
            >
              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-muted rounded-lg w-fit">
                    <BookOpen className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl" data-testid="title-portrait">3:4 (Portrait)</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 bg-muted border-2 border-border rounded-lg" style={{ width: "90px", height: "120px" }}>
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      3:4 Ratio
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-portrait-description">
                    Optimized for traditional yearbook layouts with taller pages. Best for portrait photos and vertical content.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Landscape Option */}
            <div 
              className={`cursor-pointer transition-all duration-200 ${
                selectedOrientation === "landscape" 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                  : "hover:shadow-lg"
              }`}
              onClick={() => handleOrientationSelect("landscape")}
              data-testid="option-landscape"
            >
              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-muted rounded-lg w-fit">
                    <Tablet className="h-12 w-12 text-primary rotate-90" />
                  </div>
                  <CardTitle className="text-xl" data-testid="title-landscape">4:3 (Landscape)</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 bg-muted border-2 border-border rounded-lg" style={{ width: "120px", height: "90px" }}>
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      4:3 Ratio
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-landscape-description">
                    Perfect for panoramic layouts and wide content. Ideal for group photos and horizontal spreads.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="text-center">
            <Button 
              onClick={handleConfirm}
              disabled={!selectedOrientation || loading}
              size="lg"
              className="px-8"
              data-testid="button-confirm-orientation"
            >
              {loading ? "Setting Orientation..." : "Confirm Selection"}
            </Button>
          </div>

          {selectedOrientation && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground" data-testid="text-selected-orientation">
                Selected: <span className="font-medium text-foreground">
                  {selectedOrientation === "portrait" ? "3:4 (Portrait)" : "4:3 (Landscape)"}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}