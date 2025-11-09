'use client';

import { useEffect, useState } from 'react';
import styles from './StreamlitEmbed.module.css';

interface StreamlitEmbedProps {
  /** The Streamlit page to embed (e.g., 'Score_Calculator', 'API_Documentation') */
  page?: string;
  /** Custom height for the iframe (default: 100vh) */
  height?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function StreamlitEmbed({
  page,
  height = '100vh',
  className = ''
}: StreamlitEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const streamlitUrl = process.env.NEXT_PUBLIC_STREAMLIT_URL || '';

  useEffect(() => {
    if (!streamlitUrl) {
      console.error('NEXT_PUBLIC_STREAMLIT_URL is not configured');
      setHasError(true);
      setIsLoading(false);
    }
  }, [streamlitUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Build the iframe URL with optional page parameter
  const buildIframeUrl = () => {
    const url = new URL(streamlitUrl);

    // Hide Streamlit menu and toolbar for seamless integration
    url.searchParams.set('embedded', 'true');

    // If a specific page is requested, add it to the URL
    if (page) {
      url.searchParams.set('page', page);
    }

    return url.toString();
  };

  if (!streamlitUrl) {
    return (
      <div className={styles.error}>
        <h2>Configuration Error</h2>
        <p>Streamlit URL is not configured. Please set NEXT_PUBLIC_STREAMLIT_URL in your environment variables.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.embedContainer} ${className}`} style={{ height }}>
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading Carbon Scoring App...</p>
        </div>
      )}

      {hasError && (
        <div className={styles.error}>
          <h2>Failed to Load</h2>
          <p>Unable to load the Streamlit application. Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      <iframe
        src={buildIframeUrl()}
        className={styles.iframe}
        style={{ display: isLoading || hasError ? 'none' : 'block' }}
        onLoad={handleLoad}
        onError={handleError}
        title="Carbon Scoring Application"
        allow="clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      />
    </div>
  );
}
