//Vendor Dashboard

import { useState, useEffect } from 'react';
import { Layout, Menu, List, Button, Typography, Spin, Alert } from 'antd';
import { FileSearchOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title } = Typography;

const API_VERSION = '/api/v1'; // Update this according to your API version

const AdminDashboardPage = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_VERSION}/ra-team/dashboard/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch pending reviews');
        }

        const data = await response.json();
        // Assuming the backend returns { pending_submissions: [...] }
        setPendingReviews(data.pending_reviews || []);
      } catch (err) {
        console.error('Error fetching pending reviews:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingReviews();
  }, []);

  const menuItems = [
    {
      key: 'pending',
      icon: <FileSearchOutlined />,
      label: 'Pending Reviews',
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
    },
  ];

  const handleMenuClick = (item) => {
    switch (item.key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'logout':
        localStorage.removeItem('token');
        navigate('/login');
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          theme="light"
          width={200}
          style={{ borderRight: '1px solid #f0f0f0' }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['pending']}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Content style={{ padding: '24px', background: '#fff' }}>
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={200}
        style={{
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={['pending']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Content style={{ padding: '24px', background: '#fff' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>Pending Reviews</Title>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" tip="Loading pending reviews..." />
            </div>
          ) : (
            <List
              dataSource={pendingReviews}
              renderItem={(review) => (
                <List.Item
                  key={review.id}
                  style={{
                    padding: '16px 24px',
                    marginBottom: '16px',
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: '2px'
                  }}
                  extra={
                    <Button
                      type="primary"
                      onClick={() => navigate(`/review/${review.id}`)}
                    >
                      review and score
                    </Button>
                  }
                >
                  <List.Item.Meta
                    title={review.vendor_name}
                    description={`Status: ${review.status}`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No pending reviews available' }}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboardPage;