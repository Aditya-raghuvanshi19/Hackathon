export const generateTransactionId = () => {
    return `TXN${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
  };