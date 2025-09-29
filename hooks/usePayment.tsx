import { useContext } from 'react';
import { PaymentContext, PaymentContextType } from '../contexts/PaymentContext';

export function usePayment(): PaymentContextType {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
}