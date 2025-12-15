const Sidebar = () => {
    return (<>
        <div className="sidebar-brand">
            <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="9" cy="10" r="1.5" fill="#5b4b8a"/>
                    <circle cx="15" cy="10" r="1.5" fill="#5b4b8a"/>
                    <path d="M9 14 Q12 16 15 14" stroke="#5b4b8a" strokeWidth="1.5" fill="none"/>
                </svg>
            </div>
            <span className="brand-text">Dr. Tamatim von Bitches</span>
        </div>

        <div className="sidebar-profile">
            <div className="sidebar-avatar">
                <img src="public\1108-vibing.gif" alt="User Avatar" />
            </div>
            <p className="sidebar-account-text">YOUR ACCOUNT</p>
        </div>

        <nav className="sidebar-nav">
            <a href="#dashboard" className="nav-item active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <span>Dashboard</span>
            </a>
            <a href="#departments" className="nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Departments</span>
            </a>
            <a href="Login" className="nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"/>
                </svg>
                <span href= "Login">Log out</span>
            </a>
            <a href="/QRCodeSection" className="nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18"/>
                    <rect x="7" y="7" width="10" height="10"/>
                </svg>
                <span>QR Code</span>
            </a>
        </nav>
    </>)
}
export default Sidebar;