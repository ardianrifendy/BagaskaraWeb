"use client";

import { useState, useEffect } from 'react';
import { StoreProfile, ProductInput } from '../engine/types';

const DEFAULT_PROFILE: StoreProfile = {
  sellerType: 'regular',
  isNewStore: false,
  joinedGOX: true,
  goxAdDiscount: false,
  promoProgram: 'none',
  joinedInsurance: false,
  spaylaterMode: 'off',
  spaylaterPct: 20,
  spaylaterTenor: 3,
  orderProcessingFee: 1250,
  packingCost: 0,
  adCostPct: 0,
};

const DEFAULT_PRODUCT: ProductInput = {
  name: '',
  categoryKey: 'elektronik.aksesoris_hp_casing',
  size: 'biasa',
  isPreOrder: false,
  insuranceCost: 0,
  qty: 1,
  cost: 0,
  sellerDiscount: 0,
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export function useStoreProfile() {
  return useLocalStorage<StoreProfile>('shopee_store_profile', DEFAULT_PROFILE);
}

export function useActiveProduct() {
  return useLocalStorage<ProductInput>('shopee_active_product', DEFAULT_PRODUCT);
}
