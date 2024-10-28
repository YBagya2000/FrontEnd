// AdminSider.jsx
import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    LogoutOutlined,
    BellOutlined,
    FileOutlined,
    BarChartOutlined  
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Sider } = Layout;

const AdminSider = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

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
            <div style={{ height: 32, margin: 16, background: 'rgba(0, 0, 0, 0.2)' }} />
            <Menu
                mode="inline"
                defaultSelectedKeys={['1']}
                items={[
                    {
                        key: '1',
                        icon: <DashboardOutlined />,
                        label: 'Pending Reviews',
                        onClick: () => navigate('/admin/dashboard')
                    },
                    {
                        key: '2',
                        icon: <BarChartOutlined />,
                        label: 'Risk Analysis',
                        onClick: () => navigate('/admin/analysis-dashboard')
                    },
                    {
                        key: '3',
                        icon: <UserOutlined />,
                        label: 'Profile',
                    },
                    {
                        key: '4',
                        icon: <BellOutlined />,
                        label: 'Notifications',
                    },
                    {
                        key: '5',
                        icon: <FileOutlined />,
                        label: 'Documents',
                    },
                    {
                        key: '6',
                        icon: <LogoutOutlined />,
                        label: 'Logout',
                        onClick: handleLogout,
                    },
                ]}
            />
        </Sider>
    );
};

export default AdminSider;