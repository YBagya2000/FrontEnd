import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import CorporateQuestionnaire from './pages/vendor/questionnaires/CorporateQuestionnaire';
import ContextualQuestionnaire from './pages/vendor/questionnaires/ContextualQuestionnaire';
import RiskAssessmentQuestionnaire from './pages/vendor/questionnaires/RiskAssessmentQuestionnaire';
import AdminDashboard from './pages/admin/AdminDashboardPage';
import SubmissionReview from './pages/admin/SubmissionReview';
import RegisterPage from './pages/auth/RegisterPage';
import RiskAnalysis from './pages/vendor/RiskAnalysis';
import RATeamRiskAnalysis from './pages/admin/RATeamRiskAnalysis';
import RATeamAnalysisDashboard from './pages/admin/RATeamAnalysisDashboard';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Vendor Routes */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Vendor']}>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/questionnaires/corporate"
            element={
              <ProtectedRoute allowedRoles={['Vendor']}>
                <CorporateQuestionnaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/questionnaires/contextual"
            element={
              <ProtectedRoute allowedRoles={['Vendor']}>
                <ContextualQuestionnaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/questionnaires/risk-assessment"
            element={
              <ProtectedRoute allowedRoles={['Vendor']}>
                <RiskAssessmentQuestionnaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/risk-analysis"
            element={
              <ProtectedRoute allowedRoles={['Vendor']}>
                <RiskAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RA_Team']}>
              <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:submissionId"
            element={
              <ProtectedRoute allowedRoles={['RA_Team']}>
                <SubmissionReview />
              </ProtectedRoute>       
            }
          />
          <Route
            path="/vendor/risk-analysis"
            element={
              <ProtectedRoute allowedRoles={['Vendor']}>
                <RiskAnalysis />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/risk-analysis/:submissionId"
            element={
              <ProtectedRoute allowedRoles={['RA_Team']}>
                <RATeamRiskAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analysis-dashboard"
            element={
              <ProtectedRoute allowedRoles={['RA_Team']}>
                <RATeamAnalysisDashboard />
              </ProtectedRoute>
            }
/>
          {/* <Route
            path="/admin"
          >
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['RA_Team']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route> */}

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;