import React from "react"

interface SidebarProps {
    activeTab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico'
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
    customerName: string | null
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, customerName }) => {
    const menuItems = [
        { key: 'inicio' as const, icon: 'house-door', label: 'Início' },
        { key: 'carnes' as const, icon: 'collection', label: 'Carnês' },
        { key: 'historico' as const, icon: 'clock-history', label: 'Histórico' },
        { key: 'lojas' as const, icon: 'shop', label: 'Lojas' },
        { key: 'suporte' as const, icon: 'headset', label: 'Suporte' },
        { key: 'perfil' as const, icon: 'person', label: 'Perfil' },
    ]

    return (
        <aside className="desktop-sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <span className="sidebar-logo-text">MM</span>
                </div>
                <div className="sidebar-brand-info">
                    <div className="sidebar-brand-name">MM Magazine</div>
                    <div className="sidebar-brand-subtitle">Área do Cliente</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.key}
                        className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.key)}
                    >
                        <div className="sidebar-nav-indicator"></div>
                        <i className={`bi bi-${item.icon}${activeTab === item.key ? '-fill' : ''} sidebar-nav-icon`}></i>
                        <span className="sidebar-nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        <i className="bi bi-person-fill"></i>
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{customerName ? customerName.split(' ')[0] : 'Cliente'}</div>
                        <div className="sidebar-user-role">Cliente MM</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
