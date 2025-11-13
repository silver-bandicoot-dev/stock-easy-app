import React, { createContext, useContext, useMemo } from 'react';
import { CURRENCIES, DEFAULT_PARAMETERS } from '../constants/stockEasyConstants';
import { formatCurrency as intlFormatCurrency } from '../utils/formatting';

const defaultCode = DEFAULT_PARAMETERS.deviseDefaut || 'EUR';
const defaultCurrency = CURRENCIES.find((currency) => currency.code === defaultCode);

const CurrencyContext = createContext({
  code: defaultCode,
  symbol: defaultCurrency?.symbol || defaultCode,
  format: (amount, options) => intlFormatCurrency(amount, defaultCode, options)
});

export const CurrencyProvider = ({ code, children }) => {
  const normalizedCode = code || defaultCode;
  const currencyMeta = CURRENCIES.find((currency) => currency.code === normalizedCode);
  const symbol = currencyMeta?.symbol || normalizedCode;

  const value = useMemo(() => ({
    code: normalizedCode,
    symbol,
    format: (amount, options) => intlFormatCurrency(amount, normalizedCode, options)
  }), [normalizedCode, symbol]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

