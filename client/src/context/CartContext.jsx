import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('dinesync_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [selectedTable, setSelectedTable] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      const search = window.location.search || '';
      if (path.includes('/menu/t/') || search.includes('token=') || search.includes('table=') || search.includes('t=')) {
        return null; // Let the URL resolver fetch the exact scanned table immediately
      }
    }
    const savedTable = localStorage.getItem('dinesync_selected_table');
    return savedTable ? JSON.parse(savedTable) : null;
  });

  const [tableToken, setTableToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      if (path.includes('/menu/t/')) {
        const routeToken = path.split('/menu/t/')[1]?.split('?')[0];
        if (routeToken) return routeToken;
      }
      const search = new URLSearchParams(window.location.search || '');
      const queryToken = search.get('token') || search.get('t');
      if (queryToken) return queryToken;
    }
    return localStorage.getItem('dinesync_table_token') || '';
  });

  const [isQrLocked, setIsQrLocked] = useState(() => {
    return localStorage.getItem('dinesync_qr_locked') === 'true';
  });

  const [numberOfPersons, setNumberOfPersons] = useState(() => {
    return localStorage.getItem('dinesync_persons') || '1';
  });

  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('dinesync_customer_name') || '';
  });

  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('dinesync_customer_phone') || '';
  });

  const [specialInstructions, setSpecialInstructions] = useState(() => {
    return localStorage.getItem('dinesync_instructions') || '';
  });

  const [tableOccupiedNotice, setTableOccupiedNotice] = useState('');
  const [restaurantBranding, setRestaurantBranding] = useState(null);

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      localStorage.setItem('dinesync_cart', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('dinesync_cart');
    }
  }, [cartItems]);

  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem('dinesync_selected_table', JSON.stringify(selectedTable));
    } else {
      localStorage.removeItem('dinesync_selected_table');
    }
  }, [selectedTable]);

  useEffect(() => {
    if (tableToken) {
      localStorage.setItem('dinesync_table_token', tableToken);
    } else {
      localStorage.removeItem('dinesync_table_token');
    }
  }, [tableToken]);

  useEffect(() => {
    if (isQrLocked) {
      localStorage.setItem('dinesync_qr_locked', 'true');
    } else {
      localStorage.removeItem('dinesync_qr_locked');
    }
  }, [isQrLocked]);

  useEffect(() => {
    if (numberOfPersons && numberOfPersons !== '1') {
      localStorage.setItem('dinesync_persons', numberOfPersons);
    } else {
      localStorage.removeItem('dinesync_persons');
    }
  }, [numberOfPersons]);

  useEffect(() => {
    if (customerName && customerName.trim()) {
      localStorage.setItem('dinesync_customer_name', customerName.trim());
    } else {
      localStorage.removeItem('dinesync_customer_name');
    }
  }, [customerName]);

  useEffect(() => {
    if (customerPhone && customerPhone.trim()) {
      localStorage.setItem('dinesync_customer_phone', customerPhone.trim());
    } else {
      localStorage.removeItem('dinesync_customer_phone');
    }
  }, [customerPhone]);

  useEffect(() => {
    if (specialInstructions && specialInstructions.trim()) {
      localStorage.setItem('dinesync_instructions', specialInstructions.trim());
    } else {
      localStorage.removeItem('dinesync_instructions');
    }
  }, [specialInstructions]);

  // Synchronize cached table from database on mount ONLY if not actively scanning a new table from the URL
  useEffect(() => {
    const syncCachedTable = async () => {
      // If customer arrived with an explicit QR table route or query parameter, NEVER overwrite with stale localStorage cache!
      if (typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        const search = window.location.search || '';
        if (
          path.includes('/menu/t/') ||
          search.includes('table=') ||
          search.includes('token=') ||
          search.includes('t=')
        ) {
          return;
        }
      }

      const savedTableRaw = localStorage.getItem('dinesync_selected_table');
      if (!savedTableRaw) return;
      try {
        const parsed = JSON.parse(savedTableRaw);
        if (parsed?.tableNumber) {
          const res = await api.get(`/tables/number/${parsed.tableNumber}`);
          if (res.data) {
            setSelectedTable(res.data);
            setTableToken(res.data.qrToken || '');
            if (res.data.status !== 'Available') {
              setTableOccupiedNotice(`Table ${res.data.tableNumber} is currently occupied.`);
            } else {
              setTableOccupiedNotice('');
            }
          }
        }
      } catch (err) {
        console.warn('Cached table no longer exists in restaurant layout, clearing stale cache:', err.message);
        setSelectedTable(null);
        setTableToken('');
        localStorage.removeItem('dinesync_selected_table');
        localStorage.removeItem('dinesync_table_token');
      }
    };

    syncCachedTable();
  }, []);

  // Method to resolve and lock table from QR Code token (/menu/t/:token)
  const setTableFromToken = async (tokenStr) => {
    if (!tokenStr) return null;
    const cleanToken = tokenStr.toString().trim();
    try {
      const res = await api.get(`/public/tables/${cleanToken}`);
      if (res.data && res.data.table) {
        const tableData = res.data.table;
        const resolvedToken = tableData.qrToken || cleanToken;
        setSelectedTable(tableData);
        setTableToken(resolvedToken);
        setIsQrLocked(true);
        localStorage.setItem('dinesync_selected_table', JSON.stringify(tableData));
        localStorage.setItem('dinesync_table_token', resolvedToken);
        localStorage.setItem('dinesync_qr_locked', 'true');

        if (res.data.restaurant) {
          setRestaurantBranding(res.data.restaurant);
        }

        if (tableData.status !== 'Available') {
          setTableOccupiedNotice(`Table ${tableData.tableNumber} is currently occupied.`);
        } else {
          setTableOccupiedNotice('');
        }
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to resolve table by QR token, trying fallback by table number:', err.message);
      // Fallback: try by table number in case token is a table number
      try {
        const fallbackRes = await api.get(`/tables/number/${cleanToken}`);
        if (fallbackRes.data) {
          const tableData = fallbackRes.data;
          const fallbackToken = tableData.qrToken || cleanToken;
          setSelectedTable(tableData);
          setTableToken(fallbackToken);
          setIsQrLocked(true);
          localStorage.setItem('dinesync_selected_table', JSON.stringify(tableData));
          localStorage.setItem('dinesync_table_token', fallbackToken);
          localStorage.setItem('dinesync_qr_locked', 'true');

          if (tableData.status !== 'Available') {
            setTableOccupiedNotice(`Table ${tableData.tableNumber} is currently occupied.`);
          } else {
            setTableOccupiedNotice('');
          }
          return { table: tableData };
        }
      } catch (fallbackErr) {
        console.warn('Fallback table resolution failed:', fallbackErr.message);
      }

      // If both attempts fail, clear stale table so customer is not logged to a wrong table
      setSelectedTable(null);
      setTableToken('');
      setIsQrLocked(false);
      localStorage.removeItem('dinesync_selected_table');
      localStorage.removeItem('dinesync_table_token');
      localStorage.removeItem('dinesync_qr_locked');
      setTableOccupiedNotice(err.response?.data?.message || 'Invalid or revoked QR code. Please scan a valid table QR or select below.');
      return null;
    }
  };

  // Method to detect table from table number or query (?table=1)
  const setTableFromQR = async (tableNumStr) => {
    if (!tableNumStr) return;
    const cleanNum = tableNumStr.toString().trim();
    // Check if it is a 32-character hex QR token
    if (cleanNum.length >= 24) {
      return await setTableFromToken(cleanNum);
    }
    try {
      const res = await api.get(`/tables/number/${cleanNum}`);
      const tableData = res.data;
      if (tableData) {
        const resolvedToken = tableData.qrToken || cleanNum;
        setSelectedTable(tableData);
        setTableToken(resolvedToken);
        setIsQrLocked(true);
        localStorage.setItem('dinesync_selected_table', JSON.stringify(tableData));
        localStorage.setItem('dinesync_table_token', resolvedToken);
        localStorage.setItem('dinesync_qr_locked', 'true');

        if (tableData.status !== 'Available') {
          setTableOccupiedNotice(`Table ${tableData.tableNumber} is currently occupied.`);
        } else {
          setTableOccupiedNotice('');
        }
        return tableData;
      }
    } catch (err) {
      console.warn('Failed to resolve table by number, trying public table token endpoint:', err.message);
      return await setTableFromToken(cleanNum);
    }
  };

  const addToCart = (product, quantityToAdd = 1) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item._id === product._id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantityToAdd;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            type: product.type || 'veg',
            quantity: quantityToAdd,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
  };

  const resetGuestInfo = () => {
    setCustomerName('');
    setCustomerPhone('');
    setSpecialInstructions('');
    setNumberOfPersons('1');
    localStorage.removeItem('dinesync_customer_name');
    localStorage.removeItem('dinesync_customer_phone');
    localStorage.removeItem('dinesync_instructions');
    localStorage.removeItem('dinesync_persons');
  };

  const clearCart = (resetGuest = true) => {
    setCartItems([]);
    localStorage.removeItem('dinesync_cart');
    if (resetGuest) {
      resetGuestInfo();
    }
  };

  const unlockTable = () => {
    setIsQrLocked(false);
    setSelectedTable(null);
    setTableToken('');
    localStorage.removeItem('dinesync_selected_table');
    localStorage.removeItem('dinesync_table_token');
    localStorage.removeItem('dinesync_qr_locked');
    resetGuestInfo();
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = restaurantBranding?.taxRatePercent || 5.0;
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + tax) * 100) / 100;

  const value = {
    cartItems,
    selectedTable,
    setSelectedTable,
    tableToken,
    setTableToken,
    isQrLocked,
    setIsQrLocked,
    unlockTable,
    setTableFromToken,
    setTableFromQR,
    tableOccupiedNotice,
    setTableOccupiedNotice,
    numberOfPersons,
    setNumberOfPersons,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    specialInstructions,
    setSpecialInstructions,
    resetGuestInfo,
    restaurantBranding,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount,
    subtotal,
    taxRate,
    tax,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
