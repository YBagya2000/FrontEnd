import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    FormOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Sider } = Layout;

const UserSider = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            theme="light"
        >
            <div style={{ 
                height: 32, 
                margin: 16, 
                background: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                {!collapsed && 'VENDOR PORTAL'}
            </div>
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={[
                    {
                        key: '/vendor/dashboard',
                        icon: <DashboardOutlined />,
                        label: 'Dashboard',
                        onClick: () => navigate('/vendor/dashboard')
                    },
                    {
                        key: 'questionnaires',
                        icon: <FormOutlined />,
                        label: 'Questionnaires',
                        children: [
                            {
                                key: '/vendor/questionnaires/corporate',
                                label: 'Corporate',
                                onClick: () => navigate('/vendor/questionnaires/corporate')
                            },
                            {
                                key: '/vendor/questionnaires/contextual',
                                label: 'Contextual',
                                onClick: () => navigate('/vendor/questionnaires/contextual')
                            },
                            {
                                key: '/vendor/questionnaires/risk-assessment',
                                label: 'Risk Assessment',
                                onClick: () => navigate('/vendor/questionnaires/risk-assessment')
                            }
                        ]
                    },
                    {
                        key: 'profile',
                        icon: <UserOutlined />,
                        label: 'Profile',
                    },
                    {
                        key: 'logout',
                        icon: <LogoutOutlined />,
                        label: 'Logout',
                        onClick: handleLogout
                    }
                ]}
            />
        </Sider>
    );
};

export default UserSider;