import StreamlitEmbed from '@/components/StreamlitEmbed';
import styles from '../page.module.css';

export const metadata = {
  title: 'API Documentation | Carbon Scoring',
  description: 'API documentation for the Carbon Scoring API endpoints.',
};

export default function ApiDocsPage() {
  return (
    <div className={styles.container}>
      <StreamlitEmbed page="API_Documentation" height="calc(100vh - 80px)" />
    </div>
  );
}
