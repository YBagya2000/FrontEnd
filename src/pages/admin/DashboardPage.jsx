// AdminDashboard.jsx
import { Layout, Card, Row, Col, Typography, Table, Tag, Button, Statistic } from 'antd';
import {
    UserOutlined,
} from '@ant-design/icons';

import AdminSider from '../../components/AdminSider';

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminDashboard = () => {

    // Sample data for demonstration
    const users = [
        { key: '1', username: 'john_doe', role: 'user', status: 'active', lastLogin: '2024-10-25' },
        { key: '2', username: 'jane_smith', role: 'admin', status: 'active', lastLogin: '2024-10-26' },
        { key: '3', username: 'bob_wilson', role: 'user', status: 'inactive', lastLogin: '2024-10-24' },
    ];

    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'admin' ? 'blue' : 'green'}>
                    {role.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Last Login',
            dataIndex: 'lastLogin',
            key: 'lastLogin',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button type="link" onClick={() => console.log('Edit user:', record)}>
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AdminSider />
            <Layout>
                <Header style={{ padding: 0, background: '#fff' }}>
                    <Title level={4} style={{ margin: '16px 24px' }}>
                        Admin Dashboard
                    </Title>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Total Users"
                                    value={1523}
                                    prefix={<UserOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Active Users"
                                    value={1342}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="New Users (Today)"
                                    value={12}
                                    valueStyle={{ color: '#1677ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="System Load"
                                    value={42}
                                    suffix="%"
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card style={{ marginTop: 16 }}>
                        <Title level={4}>Recent Users</Title>
                        <Table
                            columns={columns}
                            dataSource={users}
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;