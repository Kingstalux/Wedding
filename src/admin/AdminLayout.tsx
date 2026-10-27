import { NavLink, Outlet } from 'react-router'
import { Icon, type IconName } from '../components/Icon'
import { Monogram } from '../components/Typography'
import { useAuth } from './AuthProvider'
import { useSettings } from './queries'
import styles from './AdminLayout.module.css'

const links: Array<[to: string, label: string, icon: IconName]> = [
  ['/admin', 'Overview & guests', 'users'],
  ['/admin/site', 'Site & texts', 'layout'],
  ['/admin/programme', 'Programme & maps', 'pin'],
  ['/admin/gallery', 'Gallery', 'image'],
  ['/admin/wishes', 'Guest book', 'message'],
  ['/admin/gifts', 'Gifts', 'gift'],
  ['/admin/door', 'Door check-in', 'scan'],
]

/** The studio frame: sidebar on the left (on top on phones), page on the right. */
export function AdminLayout() {
  const { auth, signOut } = useAuth()
  const email = auth.status === 'admin' ? auth.email : ''
  const settings = useSettings().data

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <NavLink to="/admin" end className={styles.brand}>
          <Monogram bride={settings?.bride || 'B'} groom={settings?.groom || 'G'} size={24} gold />
          <small>Couple’s studio</small>
        </NavLink>

        <nav className={styles.nav} aria-label="Studio">
          {links.map(([to, label, icon]) => (
            // `end` so "/admin" isn't marked active on "/admin/site"
            <NavLink key={to} to={to} end={to === '/admin'}>
              <Icon name={icon} size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.foot}>
          <span className={styles.who}>Signed in as {email}</span>
          <button type="button" onClick={signOut}>
            <Icon name="signOut" /> Sign out
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
