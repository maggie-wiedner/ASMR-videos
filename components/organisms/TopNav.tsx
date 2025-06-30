'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import AuthFlowModal from '../auth/AuthFlowModal';

export default function TopNav() {
  const { user, signOut } = useAuth();
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) {
        setAccountBalance(null);
        return;
      }

      setIsLoadingBalance(true);
      try {
        // Fetch total deposits (money added to wallet)
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          return;
        }

        // Fetch total spent on videos (money deducted from wallet)
        const { data: videos, error: videosError } = await supabase
          .from('user_videos')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (videosError) {
          console.error('Error fetching videos:', videosError);
          return;
        }

        // Calculate wallet balance: deposits - (videos * $6)
        const totalDeposits = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const totalSpent = (videos?.length || 0) * 600; // $6.00 = 600 cents per video
        const walletBalance = totalDeposits - totalSpent;
        
        setAccountBalance(Math.max(0, walletBalance)); // Never show negative balance
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();
  }, [user]);

  const handleSignOut = () => {
    signOut();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              ASMR Generator
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Wallet Balance:</span>
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                  ) : (
                    <span className="text-sm font-semibold text-green-600">
                      {accountBalance !== null ? formatCurrency(accountBalance) : '$0.00'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            )}
            {!user && <AuthFlowModal />}
          </div>
        </div>
      </div>
    </nav>
  );
} 