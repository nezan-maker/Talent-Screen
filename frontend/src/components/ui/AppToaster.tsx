'use client';

import { Toaster } from 'react-hot-toast';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={10}
      containerStyle={{
        bottom: 16,
        right: 20,
      }}
    />
  );
}
