import StreamlitEmbed from '@/components/StreamlitEmbed';
import styles from '../page.module.css';

export const metadata = {
  title: 'Data Explorer | Carbon Scoring',
  description: 'Explore historical carbon scoring data and analytics.',
};

export default function DataExplorerPage() {
  return (
    <div className={styles.container}>
      <StreamlitEmbed page="Data_Explorer" height="calc(100vh - 80px)" />
    </div>
  );
}
