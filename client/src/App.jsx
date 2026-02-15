import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Play from './pages/Play';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import ChildProfile from './pages/ChildProfile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import StickerShop from './pages/StickerShop';
import AdventureMap from './pages/AdventureMap';
import MyProfile from './pages/MyProfile';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Layout><div className="loading-screen">Loading...</div></Layout>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Layout><div className="loading-screen">Loading...</div></Layout>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<PublicOnly><Layout><Login /></Layout></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Layout><Register /></Layout></PublicOnly>} />
      <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><Layout><Games /></Layout></ProtectedRoute>} />
      <Route path="/play/:gameSlug" element={<ProtectedRoute><Layout><Play /></Layout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Layout><Subscription /></Layout></ProtectedRoute>} />
      <Route path="/subscription/success" element={<ProtectedRoute><Layout><SubscriptionSuccess /></Layout></ProtectedRoute>} />
      <Route path="/subscription/cancel" element={<ProtectedRoute><Layout><SubscriptionCancel /></Layout></ProtectedRoute>} />
      <Route path="/child/:childId" element={<ProtectedRoute><Layout><ChildProfile /></Layout></ProtectedRoute>} />
      <Route path="/analytics/:childId" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><Layout><StickerShop /></Layout></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><Layout><AdventureMap /></Layout></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute><Layout><MyProfile /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
