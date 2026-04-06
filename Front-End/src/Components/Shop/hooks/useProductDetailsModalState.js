import { useState } from 'react';

export function useProductDetailsModalState() {
  const [activeTab, setActiveTab] = useState('details');

  const handleBackdropClick = (event, onClose) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return {
    activeTab,
    setActiveTab,
    handleBackdropClick,
  };
}
