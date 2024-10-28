import { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Table, 
  Space, 
  Select, 
  Button, 
  Spin, 
  Alert, 
  Typography,
  DatePicker 
} from 'antd';
import { SearchOutlined, BarChartOutlined } from '@ant-design/icons';
import AdminSider from '../../components/AdminSider';
import RiskVisualization from '../../components/RiskVisualization';
import RiskBreakdown from '../../components/RiskBreakdown';
import CalculationStages from '../../components/CalculationStages';

const { Content } = Layout;
const { Title } = Typography;
const { RangePicker } = DatePicker;

const RATeamAnalysisDashboard = () => {
    console.log('RATeamAnalysisDashboard rendering');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [, setDateRange] = useState(null);
  const [riskData, setRiskData] = useState(null);

  // Fetch all completed risk assessments
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/v1/ra-team/risk-analysis/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vendor analyses');
        }

        const data = await response.json();
        setVendors(data);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Fetch specific vendor's risk analysis
  const fetchVendorAnalysis = async (vendorId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/ra-team/risk-analysis/${vendorId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendor risk analysis');
      }

      const data = await response.json();
      setRiskData(data);
      setSelectedVendor(vendorId);
    } catch (err) {
      console.error('Error fetching vendor analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      sorter: (a, b) => a.vendor_name.localeCompare(b.vendor_name)
    },
    {
      title: 'Risk Score',
      dataIndex: 'final_score',
      key: 'final_score',
      sorter: (a, b) => a.final_score - b.final_score,
      render: score => (
        <span className={`font-bold ${
          score > 7 ? 'text-red-500' :
          score > 5 ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {score.toFixed(2)}
        </span>
      )
    },
    {
      title: 'Confidence Interval',
      dataIndex: 'confidence_interval',
      key: 'confidence_interval',
      render: (interval) => `[${interval.low.toFixed(2)}, ${interval.high.toFixed(2)}]`
    },
    {
      title: 'Submission Date',
      dataIndex: 'submission_date',
      key: 'submission_date',
      sorter: (a, b) => new Date(a.submission_date) - new Date(b.submission_date)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<BarChartOutlined />}
          onClick={() => fetchVendorAnalysis(record.id)}
        >
          View Analysis
        </Button>
      )
    }
  ];

  return (
    <Layout>
      <AdminSider />
      <Content className="p-6">
        <div className="space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <Title level={3}>Vendor Risk Analysis Dashboard</Title>
              <Space>
                <RangePicker
                  onChange={setDateRange}
                  className="w-64"
                />
                <Select
                  showSearch
                  placeholder="Search vendors"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  className="w-64"
                  onChange={(value) => fetchVendorAnalysis(value)}
                >
                  {vendors.map(vendor => (
                    <Select.Option key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </Select.Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                >
                  Search
                </Button>
              </Space>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <Spin size="large" tip="Loading analysis data..." />
              </div>
            ) : error ? (
              <Alert type="error" message={error} showIcon />
            ) : (
              <Table
                dataSource={vendors}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>

          {selectedVendor && riskData && (
            <>
              <Card title="Risk Analysis Overview">
                <RiskVisualization riskData={riskData} />
              </Card>

              <Card title="Risk Calculation Process">
                <CalculationStages stages={riskData.calculation_stages} />
              </Card>

              <Card title="Detailed Risk Breakdown">
                <RiskBreakdown factorScores={riskData.factor_scores} />
              </Card>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default RATeamAnalysisDashboard;