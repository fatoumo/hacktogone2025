'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/carbon-scoring', label: 'calculer mon score' },
    { href: '/carbon-scoring/api-docs', label: 'notre e-book' },
    { href: '/contact', label: 'Contact' },
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
            <div className={styles.logoContainer}>
              {/* Bob mascot mini icon */}
              <svg width="40" height="40" viewBox="0 0 100 100" className={styles.logoIcon}>
                <circle cx="50" cy="50" r="37" fill="#9fcaf4" />
                <circle cx="50" cy="50" r="36.5" fill="none" stroke="#3a1e14" strokeWidth="1" />
                <circle cx="57" cy="45" r="13" fill="#fff" />
                <ellipse cx="59" cy="44" rx="8" ry="11" fill="#3a1e14" transform="rotate(-31 59 44)" />
                <circle cx="43" cy="46" r="13" fill="#fff" />
                <ellipse cx="45" cy="45" rx="8" ry="11" fill="#3a1e14" transform="rotate(-31 45 45)" />
                <ellipse cx="50" cy="61" rx="2.6" ry="4.2" fill="#3a1e14" />
              </svg>
              <div className={styles.logoTextContainer}>
                <span className={styles.logoText}>Byebye</span>
                <span className={styles.logoText}>Carbon</span>
              </div>
            </div>
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
