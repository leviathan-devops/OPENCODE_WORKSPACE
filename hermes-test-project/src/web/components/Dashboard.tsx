import React, { useState, useEffect } from 'react';

interface DashboardProps {
  dataUrl: string;
}

// BUG-004: Missing null check
export function Dashboard({ dataUrl }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(dataUrl)
      .then(res => res.json())
      .then(result => {
        setData(result.data);  // Crashes if result.data is null
      });
  }, [dataUrl]);

  return <div>Dashboard with {data.length} items</div>;
}
