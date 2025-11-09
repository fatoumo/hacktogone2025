'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/carbon-scoring', label: 'Score Calculator' },
    { href: '/carbon-scoring/api-docs', label: 'API Docs' },
    { href: '/carbon-scoring/data', label: 'Data Explorer' },
    { href: '/agents', label: 'AI Agents' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <span className={styles.logoText}>Hacktogone 2025</span>
            <span className={styles.logoSubtext}>Carbon Scoring</span>
          </Link>
        </div>

        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* TODO: Add authentication when required */}
        <div className={styles.authPlaceholder}>
          {/* <button className={styles.loginButton}>Login</button> */}
        </div>
      </div>
    </nav>
  );
}
