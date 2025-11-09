import StreamlitEmbed from '@/components/StreamlitEmbed';
import styles from './page.module.css';

export const metadata = {
  title: 'Carbon Score Calculator | Hacktogone 2025',
  description: 'Calculate your carbon footprint with our interactive carbon scoring tool.',
};

export default function CarbonScoringPage() {
  return (
    <div className={styles.container}>
      <StreamlitEmbed page="Score_Calculator" height="calc(100vh - 80px)" />
    </div>
  );
}
