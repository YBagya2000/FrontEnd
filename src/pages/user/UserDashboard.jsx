// UserDashboard.jsx
import { Layout, Card, Row, Col, Typography, List, Tag, Avatar, Button } from 'antd';
import {
    UserOutlined,
    BellOutlined,
    FileOutlined
} from '@ant-design/icons';

import UserSider from '../../components/UserSider';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const UserDashboard = () => {

    // Sample data for demonstration
    const notifications = [
        { id: 1, title: 'Profile Update', description: 'Your profile was successfully updated', time: '2 hours ago' },
        { id: 2, title: 'System Maintenance', description: 'Scheduled maintenance in 24 hours', time: '5 hours ago' },
        { id: 3, title: 'New Feature', description: 'Check out our new messaging feature', time: '1 day ago' },
    ];

    const recentActivities = [
        { id: 1, action: 'Login', time: '2024-10-26 09:30', status: 'success' },
        { id: 2, action: 'Password Change', time: '2024-10-25 15:45', status: 'success' },
        { id: 3, action: 'Profile Update', time: '2024-10-24 11:20', status: 'info' },
    ];



    return (
        <Layout style={{ minHeight: '100vh' }}>
            <UserSider />
            <Layout>
                <Header style={{ padding: 0, background: '#fff' }}>
                    <Title level={4} style={{ margin: '16px 24px' }}>
                        Welcome, User!
                    </Title>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <Card title="Recent Activities">
                                <List
                                    itemLayout="horizontal"
                                    dataSource={recentActivities}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} />}
                                                title={item.action}
                                                description={item.time}
                                            />
                                            <Tag color={item.status === 'success' ? 'success' : 'processing'}>
                                                {item.status.toUpperCase()}
                                            </Tag>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card title="Notifications">
                                <List
                                    itemLayout="vertical"
                                    dataSource={notifications}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={item.title}
                                                description={
                                                    <>
                                                        <Text>{item.description}</Text>
                                                        <br />
                                                        <Text type="secondary">{item.time}</Text>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col xs={24}>
                            <Card title="Quick Actions">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={8}>
                                        <Button type="primary" block icon={<UserOutlined />}>
                                            Update Profile
                                        </Button>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Button block icon={<FileOutlined />}>
                                            View Documents
                                        </Button>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Button block icon={<BellOutlined />}>
                                            Notification Settings
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
};

export default UserDashboard;