import React, { useState, useEffect, useCallback } from 'react';
import { Settings, X, History, FileText, User as UserIcon, FileType } from 'lucide-react';
import { motion } from 'motion/react';
import { Converter } from './components/Converter';
import { PdfTools } from './components/PdfTools';
import { ImageTools } from './components/ImageTools';
import { VideoTools } from './components/VideoTools';
import { AudioTools } from './components/AudioTools';
import { TextEditor } from './components/TextEditor';
import { ArchiveTools } from './components/ArchiveTools';
import { DeveloperTools } from './components/DeveloperTools';
import { ColorTools } from './components/ColorTools';
import { PasswordGenerator } from './components/PasswordGenerator';
import { QrCodeTools } from './components/QrCodeTools';
import { MarkdownEditor } from './components/MarkdownEditor';
import { DataEditor } from './components/DataEditor';
import { HexViewer } from './components/HexViewer';
import { SvgEditor } from './components/SvgEditor';
import { RegexTester } from './components/RegexTester';
import { DocumentEditor } from './components/DocumentEditor';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useAuth } from './contexts/AuthContext';
import { signInWithGoogle, signInWithGithub, logOut, db, signInWithEmail, signUpWithEmail } from './firebase';
import { collection, query, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { logoBase64 } from './logoBase64';

const ParticleBackground = ({ theme }: { theme: 'dark' | 'light' }) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 z-0"
      options={{
        fullScreen: { enable: false },
        background: {
          color: {
            value: 'transparent',
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: 'push',
            },
            onHover: {
              enable: true,
              mode: 'repulse',
            },
            resize: {
              enable: true,
            },
          },
          modes: {
            push: {
              quantity: 2,
            },
            repulse: {
              distance: 150,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: theme === 'dark' ? '#ffffff' : '#000000',
          },
          links: {
            color: theme === 'dark' ? '#ffffff' : '#000000',
            distance: 150,
            enable: true,
            opacity: theme === 'dark' ? 0.15 : 0.05,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'bounce',
            },
            random: false,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              width: 800,
              height: 800,
            },
            value: 40,
          },
          opacity: {
            value: theme === 'dark' ? 0.5 : 0.3,
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { user, loading } = useAuth();
  const [authError, setAuthError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Email/Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'converter' | 'pdf' | 'image' | 'video' | 'audio' | 'editor' | 'markdown' | 'data' | 'svg' | 'hex' | 'archive' | 'dev' | 'regex' | 'color' | 'password' | 'qrcode' | 'document'>('converter');
  
  const [modals, setModals] = useState({
    signIn: false,
    signUp: false,
    settings: false,
    manageAccount: false,
    userMenu: false,
    history: false
  });

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithGoogle();
      setModals(prev => ({ ...prev, signIn: false, signUp: false }));
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return; // User intentionally closed the popup, ignore
      }
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError('Domain not authorized! Please add this app\'s URL to Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setAuthError('An account already exists with the same email. Please sign in using the provider you originally used (e.g., GitHub or Email).');
      } else {
        setAuthError(err.message || 'Google Login failed.');
      }
    }
  };

  const handleGithubLogin = async () => {
    setAuthError('');
    try {
      await signInWithGithub();
      setModals(prev => ({ ...prev, signIn: false, signUp: false }));
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return; // User intentionally closed the popup, ignore
      }
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError('Domain not authorized! Please add this app\'s URL to Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setAuthError('An account already exists with the same email. Please sign in using the provider you originally used (e.g., Google or Email).');
      } else {
        setAuthError(err.message || 'GitHub Login failed.');
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    
    setAuthError('');
    setIsSubmitting(true);
    
    try {
      if (modals.signIn) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      setModals(prev => ({ ...prev, signIn: false, signUp: false }));
      setEmail('');
      setPassword('');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setAuthError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please make sure Email/Password provider is enabled in Firebase Console.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setModals(prev => ({ ...prev, userMenu: false, manageAccount: false }));
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'users', user.uid, 'conversions'),
        orderBy('convertedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'users', user.uid, 'conversions'));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  useEffect(() => {
    if (modals.history && user) {
      fetchHistory();
    }
  }, [modals.history, user]);

  const [showParticles, setShowParticles] = useState(true);

  // Hide particles when mouse is near corners to reduce load
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const threshold = 150; // pixels from corner
      
      const isTopLeft = clientX < threshold && clientY < threshold;
      const isTopRight = clientX > innerWidth - threshold && clientY < threshold;
      const isBottomLeft = clientX < threshold && clientY > innerHeight - threshold;
      const isBottomRight = clientX > innerWidth - threshold && clientY > innerHeight - threshold;
      
      if (isTopLeft || isTopRight || isBottomLeft || isBottomRight) {
        if (showParticles) setShowParticles(false);
      } else {
        if (!showParticles) setShowParticles(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showParticles]);

  return (
    <div className={`flex h-screen relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#f0f0f0] text-black'}`}>
      {showParticles && <ParticleBackground theme={theme} />}
      
      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center w-full">
        {/* Top Right Auth Buttons */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-50 flex gap-2 sm:gap-3">
          {loading ? (
            <div className="flex gap-2 sm:gap-3">
              <div className={`w-[70px] sm:w-[84px] h-[34px] sm:h-[38px] rounded-full animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}></div>
              <div className={`w-[70px] sm:w-[84px] h-[34px] sm:h-[38px] rounded-full animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}></div>
            </div>
          ) : !user ? (
            <>
              <button onClick={() => setModals({...modals, signIn: true})} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm border transition-all ${theme === 'dark' ? 'border-[#444] text-[#aaa] hover:border-[#777] hover:text-white bg-[#111]' : 'border-[#ccc] text-[#555] hover:border-[#999] hover:text-black bg-white'}`}>Sign in</button>
              <button onClick={() => setModals({...modals, signUp: true})} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm border transition-all ${theme === 'dark' ? 'border-[#444] text-[#aaa] hover:border-[#777] hover:text-white bg-[#111]' : 'border-[#ccc] text-[#555] hover:border-[#999] hover:text-black bg-white'}`}>Sign up</button>
            </>
          ) : (
            <>
              <button onClick={() => setModals({...modals, history: true})} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm border flex items-center gap-1.5 sm:gap-2 transition-all ${theme === 'dark' ? 'border-[#444] text-[#aaa] hover:border-[#777] hover:text-white bg-[#111]' : 'border-[#ccc] text-[#555] hover:border-[#999] hover:text-black bg-white'}`}>
                <History size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">History</span>
              </button>
              <button className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm border flex items-center gap-1.5 sm:gap-2 transition-all ${theme === 'dark' ? 'border-[#444] text-[#aaa] hover:border-[#777] hover:text-white bg-[#111]' : 'border-[#ccc] text-[#555] hover:border-[#999] hover:text-black bg-white'}`}>
                <UserIcon size={14} className="sm:w-4 sm:h-4" /> <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.displayName || user.email?.split('@')[0] || 'Account'}</span>
              </button>
              <button onClick={handleLogout} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm border transition-all ${theme === 'dark' ? 'border-[#444] text-[#aaa] hover:border-red-500 hover:text-red-500 bg-[#111]' : 'border-[#ccc] text-[#555] hover:border-red-500 hover:text-red-500 bg-white'}`}>Sign out</button>
            </>
          )}
        </div>

        <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 h-full overflow-y-auto flex flex-col items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex-1 flex flex-col items-center justify-center w-full py-12 sm:py-0">
            <div className="text-center max-w-[800px] w-full px-2 sm:px-6 mb-6 sm:mb-8 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-4 sm:mb-6 flex justify-center"
              >
                <img src={logoBase64} alt="Logo" className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain" referrerPolicy="no-referrer" />
              </motion.div>
              <h1 className={`text-[50px] sm:text-[70px] md:text-[100px] lg:text-[120px] font-black tracking-tighter mb-1 sm:mb-2 leading-tight flex justify-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {"Xer0byte".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                    className={theme === 'dark' ? 'animate-star-shine' : 'animate-star-shine-light'}
                  >
                    {char}
                  </motion.span>
                ))}
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.8 }}
                className={`text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] ${theme === 'dark' ? 'text-[#bbb]' : 'text-[#555]'}`}
              >
                Universal File Converter
              </motion.p>
            </div>
            
            <div className={`w-full rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#161616] border-[#2a2a2a]' : 'bg-white border-[#ddd]'}`}>
              <div className={`flex flex-wrap gap-2 p-4 border-b ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-[#ddd]'}`}>
                <button 
                  onClick={() => setActiveTab('converter')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'converter' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  File Converter
                </button>
                <button 
                  onClick={() => setActiveTab('pdf')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pdf' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  PDF Tools
                </button>
                <button 
                  onClick={() => setActiveTab('image')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'image' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Image Tools
                </button>
                <button 
                  onClick={() => setActiveTab('video')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'video' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Video Tools
                </button>
                <button 
                  onClick={() => setActiveTab('audio')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'audio' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Audio Tools
                </button>
                <button 
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'editor' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Code Editor
                </button>
                <button 
                  onClick={() => setActiveTab('markdown')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'markdown' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Markdown
                </button>
                <button 
                  onClick={() => setActiveTab('document')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'document' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Word/Doc Editor
                </button>
                <button 
                  onClick={() => setActiveTab('data')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'data' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Spreadsheet
                </button>
                <button 
                  onClick={() => setActiveTab('svg')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'svg' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  SVG Editor
                </button>
                <button 
                  onClick={() => setActiveTab('hex')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'hex' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Hex Viewer
                </button>
                <button 
                  onClick={() => setActiveTab('archive')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'archive' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Archive Tools
                </button>
                <button 
                  onClick={() => setActiveTab('dev')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'dev' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Dev Tools
                </button>
                <button 
                  onClick={() => setActiveTab('regex')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'regex' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Regex Tester
                </button>
                <button 
                  onClick={() => setActiveTab('color')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'color' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Color Tools
                </button>
                <button 
                  onClick={() => setActiveTab('password')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'password' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  Password Gen
                </button>
                <button 
                  onClick={() => setActiveTab('qrcode')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'qrcode' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#666] hover:text-black hover:bg-[#f5f5f5]')}`}
                >
                  QR Code
                </button>
              </div>
              
              {activeTab === 'converter' && <Converter theme={theme} />}
              {activeTab === 'pdf' && <PdfTools theme={theme} />}
              {activeTab === 'image' && <ImageTools theme={theme} />}
              {activeTab === 'video' && <VideoTools theme={theme} />}
              {activeTab === 'audio' && <AudioTools theme={theme} />}
              {activeTab === 'editor' && <TextEditor theme={theme} />}
              {activeTab === 'markdown' && <MarkdownEditor theme={theme} />}
              {activeTab === 'document' && <DocumentEditor theme={theme} />}
              {activeTab === 'data' && <DataEditor theme={theme} />}
              {activeTab === 'svg' && <SvgEditor theme={theme} />}
              {activeTab === 'hex' && <HexViewer theme={theme} />}
              {activeTab === 'archive' && <ArchiveTools theme={theme} />}
              {activeTab === 'dev' && <DeveloperTools theme={theme} />}
              {activeTab === 'regex' && <RegexTester theme={theme} />}
              {activeTab === 'color' && <ColorTools theme={theme} />}
              {activeTab === 'password' && <PasswordGenerator theme={theme} />}
              {activeTab === 'qrcode' && <QrCodeTools theme={theme} />}
            </div>
          </div>
          
          {/* Footer inside the scrollable area */}
          <footer className={`mt-auto pt-10 pb-6 text-center text-xs sm:text-sm w-full ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
            &copy; {new Date().getFullYear()} Xer0byte. All rights reserved.
          </footer>
          
          <div className="h-20 w-full flex-shrink-0 sm:hidden"></div>
        </div>

        {/* Bottom Left User & Settings */}
        <div className="absolute bottom-6 left-6 flex items-center gap-3 z-20">
          <div className="relative">
            {loading ? (
              <div className={`w-11 h-11 rounded-full animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}></div>
            ) : (
              <div 
                onClick={() => setModals({...modals, userMenu: !modals.userMenu})}
                className="w-11 h-11 rounded-full cursor-pointer flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-[#444]"
                style={{ background: user ? '#00ff9d' : '#444', color: user ? '#000' : '#fff' }}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user ? (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase() : 'U'
                )}
              </div>
            )}
            
            {/* User Menu Dropdown */}
            {modals.userMenu && (
              <div className={`absolute bottom-14 left-0 w-48 rounded-xl border shadow-2xl py-2 ${theme === 'dark' ? 'bg-[#111] border-[#333] text-white' : 'bg-[#f5f5f5] border-[#ddd] text-black'}`}>
                {user && (
                  <div className={`px-4 py-2 cursor-pointer hover:bg-black/10 ${theme === 'dark' ? 'hover:bg-white/10' : ''}`} onClick={() => { setModals({...modals, userMenu: false, history: true}); }}>History</div>
                )}
                <div className={`px-4 py-2 cursor-pointer hover:bg-black/10 ${theme === 'dark' ? 'hover:bg-white/10' : ''}`} onClick={() => { setModals({...modals, userMenu: false, settings: true}); }}>Settings</div>
                <div className={`px-4 py-2 cursor-pointer hover:bg-black/10 ${theme === 'dark' ? 'hover:bg-white/10' : ''}`}>Help</div>
                <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333]' : 'border-[#ddd]'}`}></div>
                <div className={`px-4 py-2 cursor-pointer hover:bg-black/10 ${theme === 'dark' ? 'hover:bg-white/10' : ''}`}>Upgrade plan</div>
                {user && (
                  <div className={`px-4 py-2 cursor-pointer hover:bg-black/10 text-red-500 ${theme === 'dark' ? 'hover:bg-white/10' : ''}`} onClick={handleLogout}>Sign Out</div>
                )}
              </div>
            )}
          </div>
          
          <button onClick={() => setModals({...modals, settings: true})} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'text-[#888] hover:bg-[#222] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'}`}>
            <Settings size={18} />
          </button>
        </div>
      </main>
      
      {/* Modals */}
      
      {/* Settings Modal */}
      {modals.settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) setModals({...modals, settings: false}) }}>
          <div className={`w-[90%] max-w-[720px] max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#111] border-[#333] text-white' : 'bg-[#f5f5f5] border-[#ddd] text-black'}`}>
            <div className={`flex justify-between items-center p-4 px-6 border-b sticky top-0 z-10 ${theme === 'dark' ? 'border-[#333] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
              <h2 className="text-xl font-semibold">Settings</h2>
              <button onClick={() => setModals({...modals, settings: false})} className="hover:opacity-70"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Account Section */}
              <section>
                <h3 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Account</h3>
                <div className={`flex justify-between items-center py-3 border-b ${theme === 'dark' ? 'border-[#222]' : 'border-[#ddd]'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white overflow-hidden border border-[#444]" style={{ background: user ? '#00ff9d' : '#555', color: user ? '#000' : '#fff' }}>
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        user ? (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase() : 'U'
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{user ? (user.displayName || 'User') : 'Not logged in'}</div>
                      <div className="text-sm opacity-60">{user ? user.email : ''}</div>
                    </div>
                  </div>
                  {user && (
                    <button onClick={() => setModals({...modals, settings: false, manageAccount: true})} className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-[#222] border-[#444] hover:bg-[#333]' : 'bg-[#e0e0e0] border-[#ccc] hover:bg-[#d0d0d0]'}`}>Manage</button>
                  )}
                </div>
              </section>
              
              {/* Appearance Section */}
              <section>
                <h3 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Appearance</h3>
                <div className={`flex justify-between items-center py-3 border-b ${theme === 'dark' ? 'border-[#222]' : 'border-[#ddd]'}`}>
                  <span>Theme</span>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-[#00ff9d] text-black border-transparent' : 'bg-[#222] border border-[#444]'}`}>Light</button>
                    <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-[#00ff9d] text-black border-transparent' : 'bg-[#e0e0e0] border border-[#ccc]'}`}>Dark</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {modals.history && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) setModals({...modals, history: false}) }}>
          <div className={`w-[90%] max-w-[720px] max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#111] border-[#333] text-white' : 'bg-[#f5f5f5] border-[#ddd] text-black'}`}>
            <div className={`flex justify-between items-center p-4 px-6 border-b sticky top-0 z-10 ${theme === 'dark' ? 'border-[#333] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
              <h2 className="text-xl font-semibold flex items-center gap-2"><History size={20} /> Conversion History</h2>
              <div className="flex items-center gap-4">
                {history.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirmClear) {
                        handleClearHistory();
                        setConfirmClear(false);
                      } else {
                        setConfirmClear(true);
                        setTimeout(() => setConfirmClear(false), 3000);
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
                  >
                    {confirmClear ? 'Click to Confirm' : 'Clear All'}
                  </button>
                )}
                <button onClick={() => setModals({...modals, history: false})} className="hover:opacity-70"><X size={24} /></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <History size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No conversions yet.</p>
                  <p className="text-sm mt-1">Files you convert will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#222] border-[#444]' : 'bg-white border-[#ccc]'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-medium text-sm ${theme === 'dark' ? 'bg-[#111] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                          <FileType size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-[300px]">{item.originalName}</div>
                          <div className={`text-xs mt-1 flex items-center gap-2 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                            <span className="uppercase">{item.originalFormat}</span>
                            <span>→</span>
                            <span className="uppercase text-[#00ff9d]">{item.targetFormat}</span>
                            <span>•</span>
                            <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs text-right ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
                        {item.convertedAt?.toDate ? new Date(item.convertedAt.toDate()).toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {(modals.signIn || modals.signUp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) setModals({...modals, signIn: false, signUp: false}) }}>
          <div className={`w-[90%] max-w-[480px] rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#111] border-[#333] text-white' : 'bg-[#f5f5f5] border-[#ddd] text-black'}`}>
            <div className={`flex justify-between items-center p-4 px-6 border-b ${theme === 'dark' ? 'border-[#333]' : 'border-[#ddd]'}`}>
              <h2 className="text-xl font-semibold">{modals.signIn ? 'Sign in' : 'Sign up'}</h2>
              <button onClick={() => {
                setModals({...modals, signIn: false, signUp: false});
                setAuthError('');
                setEmail('');
                setPassword('');
              }} className="hover:opacity-70"><X size={24} /></button>
            </div>
            <div className="p-6">
              {authError && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-500 text-sm">{authError}</div>}
              
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'} ${theme === 'dark' ? 'bg-[#00ff9d] text-black' : 'bg-[#006633] text-white'}`}
                >
                  {isSubmitting ? 'Please wait...' : (modals.signIn ? 'Sign in with Email' : 'Sign up with Email')}
                </button>
              </form>

              <div className="relative flex items-center py-2 mb-6">
                <div className={`flex-grow border-t ${theme === 'dark' ? 'border-[#444]' : 'border-[#ccc]'}`}></div>
                <span className={`flex-shrink-0 mx-4 text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Or continue with</span>
                <div className={`flex-grow border-t ${theme === 'dark' ? 'border-[#444]' : 'border-[#ccc]'}`}></div>
              </div>

              <div className="space-y-4">
                <button onClick={handleGoogleLogin} className={`w-full py-3 rounded-xl border flex items-center justify-center gap-3 transition-colors ${theme === 'dark' ? 'border-[#444] hover:bg-[#222] bg-white text-black' : 'border-[#ccc] hover:bg-[#e0e0e0] bg-black text-white'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                
                <button onClick={handleGithubLogin} className={`w-full py-3 rounded-xl border flex items-center justify-center gap-3 transition-colors ${theme === 'dark' ? 'border-[#444] hover:bg-[#222]' : 'border-[#ccc] hover:bg-[#e0e0e0]'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </button>
              </div>
              
              <div className="mt-6 text-center text-sm opacity-70">
                {modals.signIn ? (
                  <>Don't have an account? <button type="button" onClick={() => { setModals({...modals, signIn: false, signUp: true}); setAuthError(''); setEmail(''); setPassword(''); }} className="underline hover:text-[#00ff9d]">Sign up</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={() => { setModals({...modals, signUp: false, signIn: true}); setAuthError(''); setEmail(''); setPassword(''); }} className="underline hover:text-[#00ff9d]">Sign in</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Account Modal */}
      {modals.manageAccount && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={(e) => { if(e.target === e.currentTarget) setModals({...modals, manageAccount: false}) }}>
          <div className={`w-[90%] max-w-[520px] rounded-2xl border shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#111] border-[#333] text-white' : 'bg-[#f8f8f8] border-[#ccc] text-black'}`}>
            <div className={`flex justify-between items-center p-4 px-6 border-b ${theme === 'dark' ? 'border-[#333]' : 'border-[#ddd]'}`}>
              <h2 className="text-xl font-semibold">Manage Account</h2>
              <button onClick={() => setModals({...modals, manageAccount: false})} className="hover:opacity-70"><X size={24} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden border border-[#444]" style={{ background: user ? '#00ff9d' : '#555', color: user ? '#000' : '#fff' }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user ? (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <div className="text-2xl font-semibold">{user ? (user.displayName || 'User') : 'Not logged in'}</div>
                  <div className={`text-[15px] ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>{user ? user.email : ''}</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`flex justify-between items-center py-4 mt-4 border-t ${theme === 'dark' ? 'border-[#444]' : 'border-[#ddd]'}`}>
                  <span>Sign out from all devices</span>
                  <button onClick={handleLogout} className="px-4 py-1.5 rounded-lg bg-[#ff4444]/20 text-[#ff4444] hover:bg-[#ff4444]/30">Sign out everywhere</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
