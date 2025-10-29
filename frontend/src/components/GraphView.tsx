import React, { useEffect, useRef } from 'react';

interface GraphViewProps {
  data: string; // HTML string
}

const GraphView: React.FC<GraphViewProps> = ({ data }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && data) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(data);
        iframeDoc.close();
      }
    }
  }, [data]);

  return (
    <iframe
      ref={iframeRef}
      style={{ width: '100%', height: '100%', minHeight: '400px', border: 'none' }}
      title="Graph Visualization"
    />
  );
};

export default GraphView;