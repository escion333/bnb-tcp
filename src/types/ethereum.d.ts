interface EthereumProvider {
  request: (args: {
    method: string;
    params?: any[];
  }) => Promise<any>;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
} 