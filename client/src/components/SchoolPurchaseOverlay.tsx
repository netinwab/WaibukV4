import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { CartItem } from "@shared/schema";

interface SchoolPurchaseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  price: number;
  schoolId: string;
  userId: string;
  isFree?: boolean;
}

export function SchoolPurchaseOverlay({ 
  isOpen, 
  onClose, 
  year, 
  price, 
  schoolId,
  userId,
  isFree = false
}: SchoolPurchaseOverlayProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { convertPrice, formatPrice } = useCurrency();

  // Optimistic add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (cartData: { userId: string; schoolId: string; year: number; price: string }) => {
      await apiRequest("POST", "/api/cart", cartData);
    },
    onMutate: async (newCartItem) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });

      // Snapshot the previous value
      const previousCartItems = queryClient.getQueryData<CartItem[]>(["/api/cart", userId]);

      // Optimistically update the cart - create a temporary cart item
      const optimisticCartItem: CartItem = {
        id: `temp-${Date.now()}`, // Temporary ID
        userId: newCartItem.userId,
        schoolId: newCartItem.schoolId,
        year: newCartItem.year,
        price: newCartItem.price,
        addedAt: new Date()
      };

      queryClient.setQueryData<CartItem[]>(["/api/cart", userId], (old = []) => [
        ...old,
        optimisticCartItem
      ]);

      // Show immediate success feedback
      toast({
        title: "Added to cart! ✨",
        description: `${year} yearbook has been added to your cart.`,
        action: (
          <Button 
            size="sm" 
            onClick={() => setLocation("/cart")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View Cart
          </Button>
        )
      });

      // Return a context object with the snapshotted value
      return { previousCartItems, optimisticCartItem };
    },
    onError: (error: any, newCartItem, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["/api/cart", userId], context?.previousCartItems || []);
      
      // Handle the case where item is already in cart
      if (error.message?.includes("already in cart")) {
        toast({
          title: "Already in cart",
          description: "This yearbook is already in your cart.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to add to cart",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    },
    onSuccess: () => {
      // Refresh the cart data to get the real server data with correct IDs
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      onClose();
    }
  });

  const handleAddToCart = async () => {
    const cartData = {
      userId,
      schoolId,
      year: parseInt(year),
      price: isFree ? "0.00" : price.toString()
    };

    addToCartMutation.mutate(cartData);
  };

  const handleViewCart = () => {
    onClose();
    setLocation("/cart");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="school-purchase-overlay">
        <div className="space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Purchase Yearbook Access</span>
            </DialogTitle>
            <DialogDescription>
              Add {year} yearbook to your cart or proceed to checkout.
            </DialogDescription>
          </DialogHeader>

          {/* Year Summary Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{year} Yearbook</h3>
                  <p className="text-sm text-gray-600">
                    School administrator access
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                    {isFree ? "FREE" : formatPrice(convertPrice(price))}
                  </div>
                  {isFree && (
                    <p className="text-xs text-green-600 font-medium">First purchase</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">What's included:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Full access to {year} yearbook content</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Upload and manage student memories</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Yearbook management tools</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-add-to-cart"
            >
              {addToCartMutation.isPending ? (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleViewCart}
              variant="outline"
              className="flex-1"
              data-testid="button-view-cart"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Cart
            </Button>
          </div>

          {!isFree && (
            <p className="text-xs text-gray-500 text-center">
              * This is a demo. No actual payment will be processed.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}