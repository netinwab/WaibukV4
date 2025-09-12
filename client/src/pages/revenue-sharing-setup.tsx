import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, DollarSign, Building2, CheckCircle, AlertCircle, CreditCard } from "lucide-react";

interface User {
  id: string;
  username: string;
  userType: "school" | "viewer" | "student";
  fullName: string;
  schoolId?: string;
}

interface School {
  id: string;
  name: string;
  paystackSubaccountCode?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  subaccountStatus?: string;
  revenueSharePercentage?: number;
}

interface Bank {
  name: string;
  code: string;
  slug: string;
}

export default function RevenueShareSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.userType !== "school") {
        setLocation("/");
      }
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  // Fetch school data
  const { data: school } = useQuery<School>({
    queryKey: ["/api/schools", user?.schoolId],
    enabled: !!user?.schoolId,
  });

  // Fetch available banks
  const { data: banksData } = useQuery<{ status: boolean; data: Bank[] }>({
    queryKey: ["/api/banks"],
  });

  // Create subaccount mutation
  const createSubaccountMutation = useMutation({
    mutationFn: async (data: { bankAccountNumber: string; bankCode: string }) => {
      const response = await apiRequest("POST", `/api/schools/${user?.schoolId}/create-subaccount`, data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status) {
        toast({
          title: "Revenue sharing setup successful!",
          description: `Your account is now set up to receive 80% of yearbook sales. Account holder: ${data.data.account_holder_name}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId] });
        setBankAccountNumber("");
        setSelectedBankCode("");
      } else {
        toast({
          title: "Setup failed",
          description: data.message || "Failed to set up revenue sharing. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while setting up revenue sharing.",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankAccountNumber || !selectedBankCode) {
      toast({
        title: "Missing information",
        description: "Please provide both bank account number and select a bank.",
        variant: "destructive"
      });
      return;
    }

    createSubaccountMutation.mutate({
      bankAccountNumber,
      bankCode: selectedBankCode
    });
  };

  const isAlreadySetup = school?.paystackSubaccountCode && school?.subaccountStatus === 'active';

  if (!user || user.userType !== "school") {
    return <div className="p-4">Access denied. School administrators only.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
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
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/school-dashboard")}
                  className="text-white hover:bg-white/10"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-white">Revenue Sharing Setup</h1>
                  <p className="text-white/70 text-sm">Configure automatic payments for yearbook sales</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-white" />
                <span className="text-white font-medium">{school?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isAlreadySetup ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Revenue Sharing Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-2">Your revenue sharing is successfully configured!</h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Revenue Share:</strong> You receive {school?.revenueSharePercentage || 80}% of all yearbook sales</p>
                      <p><strong>Bank Account:</strong> ****{school?.bankAccountNumber?.slice(-4)}</p>
                      <p><strong>Status:</strong> Active and ready to receive payments</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mt-1 text-blue-500" />
                    <div>
                      <p className="font-medium">How it works:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>When viewers purchase yearbooks, 80% goes directly to your bank account</li>
                        <li>Payments are processed automatically through Paystack</li>
                        <li>You'll receive settlements according to Paystack's schedule</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Set Up Revenue Sharing
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Configure your bank account to automatically receive 80% of yearbook sales revenue.
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Revenue Split Details:</p>
                        <ul className="space-y-1">
                          <li>• <strong>Your school receives:</strong> 80% of every yearbook sale</li>
                          <li>• <strong>Platform fee:</strong> 20% (covers processing, hosting, and maintenance)</li>
                          <li>• <strong>Payment processor:</strong> Paystack (secure and reliable)</li>
                          <li>• <strong>Settlement:</strong> Automatic transfer to your bank account</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bank" data-testid="label-bank">Select Bank</Label>
                      <Select value={selectedBankCode} onValueChange={setSelectedBankCode}>
                        <SelectTrigger data-testid="select-bank">
                          <SelectValue placeholder="Choose your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banksData?.data?.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="accountNumber" data-testid="label-account-number">Account Number</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter your 10-digit account number"
                        maxLength={10}
                        data-testid="input-account-number"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will be verified with your bank before setup is completed.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createSubaccountMutation.isPending || !bankAccountNumber || !selectedBankCode}
                    className="w-full"
                    data-testid="button-setup-revenue-sharing"
                  >
                    {createSubaccountMutation.isPending ? "Setting up..." : "Set Up Revenue Sharing"}
                  </Button>
                </form>

                <div className="mt-6 text-xs text-gray-500">
                  <p>
                    By setting up revenue sharing, you agree to receive payments through Paystack.
                    Your bank details will be securely stored and used only for payment processing.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}