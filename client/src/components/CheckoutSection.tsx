import { useState, useEffect } from "react";
import { usePaystackPayment } from "react-paystack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShoppingCart, CheckCircle, Loader2, Package, Truck, RefreshCw } from "lucide-react";
import type { CartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getUSDToNGNRate, convertUSDToNGN, formatNGN, formatUSD } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CheckoutSectionProps {
  cartItems: CartItem[];
  total: number;
  userType: string;
  onContinueShopping: () => void;
}

export function CheckoutSection({ cartItems, total, userType, onContinueShopping }: CheckoutSectionProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number>(1650); // Default rate
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [lastPaymentReference, setLastPaymentReference] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const { toast } = useToast();
  const { convertPrice, formatPrice, userCurrency } = useCurrency();

  // Get user data
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Define calculation functions first
  const calculateSubtotal = () => total;
  const calculateFinalTotal = () => calculateSubtotal();

  // Fetch exchange rate on component mount and check for stored payment reference
  useEffect(() => {
    const fetchExchangeRate = async () => {
      setIsLoadingRate(true);
      try {
        const rate = await getUSDToNGNRate();
        setExchangeRate(rate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        toast({
          title: "Exchange rate error",
          description: "Using approximate exchange rate. Please refresh if needed.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingRate(false);
      }
    };

    // Check for stored payment reference
    const storedReference = localStorage.getItem('lastPaymentReference');
    if (storedReference) {
      setLastPaymentReference(storedReference);
    }

    fetchExchangeRate();
  }, [toast]);

  // Calculate the total amount (already in correct format)
  const finalTotalUSD = calculateFinalTotal();
  const finalTotalNGN = convertUSDToNGN(finalTotalUSD, exchangeRate);

  // Paystack configuration
  const config = {
    reference: new Date().getTime().toString(),
    email: customerEmail || user.email || "",
    amount: Math.round(finalTotalNGN * 100), // Convert to kobo (Paystack's smallest unit)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    currency: "NGN",
  };

  const initializePayment = usePaystackPayment(config);

  // Paystack payment success handler
  const onSuccess = (reference: any) => {
    console.log('Payment successful:', reference);
    setPurchaseComplete(true);
    
    toast({
      title: "Payment successful!",
      description: `Your payment of ${formatNGN(finalTotalNGN)} (${formatUSD(finalTotalUSD)}) has been processed successfully.`
    });

    // Auto-close and reload after success
    setTimeout(() => {
      setShowCheckout(false);
      setPurchaseComplete(false);
      window.location.reload();
    }, 3000);
  };

  // Paystack payment close handler
  const onClose = () => {
    console.log('Payment closed');
    toast({
      title: "Payment cancelled",
      description: "You cancelled the payment process.",
      variant: "destructive"
    });
  };

  const handleProcessPayment = async () => {
    if (!customerEmail && !user.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to proceed with payment.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize payment with our backend
      const paymentData = {
        email: customerEmail || user.email,
        amount: finalTotalNGN, // Send NGN amount to backend (already converted)
        cartItems: cartItems,
        userId: user.id
      };

      const response = await apiRequest("POST", "/api/payments/initialize", paymentData);
      const result = await response.json();
      
      if (result.status) {
        // Store payment reference for manual verification
        setLastPaymentReference(result.data.reference);
        localStorage.setItem('lastPaymentReference', result.data.reference);
        
        // Open Paystack payment page in same window (ensures redirect back works)
        window.location.href = result.data.authorization_url;
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Optimistic payment verification function
  const handleCheckPaymentStatus = async () => {
    const reference = lastPaymentReference || localStorage.getItem('lastPaymentReference');
    
    if (!reference) {
      toast({
        title: "No payment reference found",
        description: "Please make a payment first.",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingPayment(true);

    // Show optimistic success message immediately
    toast({
      title: "Checking payment... ⏳",
      description: "Verifying your payment with Paystack...",
    });

    try {
      const response = await apiRequest("GET", `/api/payments/verify/${reference}`);
      const result = await response.json();
      
      if (response.ok && result.status !== false) {
        // Payment verification successful - show enhanced success
        toast({
          title: "Payment verified! ✅",
          description: "Your purchase is complete! Updating your library...",
        });
        
        // Clear stored reference
        localStorage.removeItem('lastPaymentReference');
        setLastPaymentReference(null);
        
        // Show completion animation
        setPurchaseComplete(true);
        
        // Force refresh cart and purchase data  
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/year-purchases"] });
        queryClient.invalidateQueries({ queryKey: ["/api/viewer-purchases"] });
        
        // Auto-reload with success indication
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Check for specific error messages
        const errorMsg = result?.message || response.statusText || "Payment verification failed";
        
        toast({
          title: "Verification failed ❌",
          description: errorMsg.includes('not found') 
            ? "Payment may still be processing. Please wait a moment and try again."
            : errorMsg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Network error ⚠️",
        description: `Failed to connect to payment service: ${error.message}. Please check your internet connection and try again.`,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsCheckingPayment(false), 500); // Small delay to show success state
    }
  };

  const handleDemoActivation = async () => {
    if (!customerEmail && !user.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to proceed with demo activation.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Show immediate optimistic feedback
    toast({
      title: "Processing payment... 💳",
      description: "Activating your yearbook access...",
    });
    
    // Simulate processing with enhanced UI feedback
    setTimeout(() => {
      setPurchaseComplete(true);
      
      toast({
        title: "Demo Payment Successful! 🎉",
        description: `Demo activation completed for ${formatPrice(convertPrice(finalTotalUSD))}. Your yearbooks are now available!`
      });

      // Auto-close and reload after success with smoother animation
      setTimeout(() => {
        setShowCheckout(false);
        setPurchaseComplete(false);
        setIsProcessing(false);
        window.location.reload();
      }, 2500);
    }, 1200); // Slightly faster than before
  };

  // Function to manually refresh exchange rate
  const refreshExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const rate = await getUSDToNGNRate();
      setExchangeRate(rate);
      toast({
        title: "Exchange rate updated",
        description: `Current rate: 1 USD = ${formatNGN(rate)}`
      });
    } catch (error) {
      toast({
        title: "Failed to update exchange rate",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRate(false);
    }
  };


  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => setShowCheckout(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          data-testid="button-checkout"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Proceed to Checkout
        </Button>
        
        {userType !== "school" && (
          <Button 
            onClick={onContinueShopping}
            variant="outline"
            size="lg"
            data-testid="button-continue-shopping-bottom"
          >
            Continue Shopping
          </Button>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="checkout-dialog">
          {purchaseComplete ? (
            // Success State
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-green-800 text-xl">Order Complete!</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Thank you for your purchase. You now have access to all yearbook content.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>Order confirmed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Truck className="h-4 w-4" />
                  <span>Digital delivery</span>
                </div>
              </div>
            </div>
          ) : (
            // Checkout Form
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Checkout</span>
                </DialogTitle>
                <DialogDescription>
                  Complete your purchase for {cartItems.length} yearbook{cartItems.length > 1 ? 's' : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Summary</h3>
                  
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {cartItems.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.year} Yearbook</p>
                            <p className="text-sm text-gray-600">Digital Access</p>
                          </div>
                          <span className="font-semibold">{formatPrice(convertPrice(parseFloat(item.price || "0")))}</span>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>{formatPrice(convertPrice(finalTotalUSD))}</span>
                        </div>
                        {userCurrency === 'NGN' && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Exchange Rate:</span>
                            <div className="flex items-center space-x-1">
                              <span>1 USD = {formatPrice(exchangeRate, 'NGN')}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={refreshExchangeRate}
                                disabled={isLoadingRate}
                                title="Refresh exchange rate"
                              >
                                <RefreshCw className={`h-3 w-3 ${isLoadingRate ? 'animate-spin' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customerEmail">Email Address</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={customerEmail || user.email || ""}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        data-testid="input-customer-email"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Payment receipt will be sent to this email
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Secure Payment with Paystack</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Your payment is processed securely by Paystack</li>
                        <li>• We accept Visa, Mastercard, and local bank transfers</li>
                        <li>• All transactions are encrypted and secure</li>
                        <li>• You'll be redirected to complete your payment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCheckout(false)} 
                  disabled={isProcessing || isCheckingPayment}
                  className="flex-1"
                  data-testid="button-cancel-checkout"
                >
                  Cancel
                </Button>
                
                {lastPaymentReference && (
                  <Button 
                    onClick={handleCheckPaymentStatus}
                    disabled={isCheckingPayment || isProcessing}
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                    data-testid="button-check-payment"
                  >
                    {isCheckingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Payment
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={handleDemoActivation}
                  disabled={isProcessing || isLoadingRate || isCheckingPayment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-demo-activate"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Demo Activate
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleProcessPayment}
                  disabled={isProcessing || isLoadingRate || isCheckingPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-process-payment"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isLoadingRate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading rate...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {formatPrice(convertPrice(finalTotalUSD))}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                * Secure payment processing powered by Paystack
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}