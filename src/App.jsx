import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Feed from './pages/Feed.jsx';
import PostDetail from './pages/PostDetail.jsx';
import CreatePost from './pages/CreatePost.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Members from './pages/Members.jsx';
import UserProfile from './pages/UserProfile.jsx';
import EditPost from './pages/EditPost.jsx';
import Communities from './pages/Communities.jsx';
import CreateCommunity from './pages/CreateCommunity.jsx';
import CommunityDetail from './pages/CommunityDetail.jsx';
import GoogleCallback from './pages/GoogleCallback.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/feed"         element={<Feed />} />
          <Route path="/posts/new"    element={<CreatePost />} />
          <Route path="/posts/:id/edit" element={<EditPost />} />
          <Route path="/posts/:id"    element={<PostDetail />} />
          <Route path="/profile"      element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/members"      element={<Members />} />
          <Route path="/users/:id"    element={<UserProfile />} />
          <Route path="/communities"     element={<Communities />} />
          <Route path="/communities/new" element={<CreateCommunity />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

