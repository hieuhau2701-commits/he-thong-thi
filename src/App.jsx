<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, 
  sendEmailVerification 
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, UserCircle, GraduationCap, 
  PlusCircle, Save, ArrowLeft, BookOpen, PlayCircle, 
  AlertCircle, Trash2, Loader2, Mail, Lock, LogIn, UserPlus, 
  Download, Upload, Image as ImageIcon, X, 
  BarChart2, Eye, Users, Calendar, FileText 
} from 'lucide-react';

// === BƯỚC 1: CẤU HÌNH FIREBASE ===
// (Lưu ý: Bạn phải lấy các thông số thật từ trang Firebase Console thay vào các chữ YOUR_...)
const firebaseConfig = {
  apiKey: "AIzaSyAqJzVPjstw570AfjzhTL9V-wBgrffqTAk",
  authDomain: "hieu-abfde.firebaseapp.com",
  projectId: "hieu-abfde",
  storageBucket: "hieu-abfde.firebasestorage.app",
  messagingSenderId: "643223090105",
  appId: "1:643223090105:web:39e8f00d1af0aae1e03c68",
  measurementId: "G-MW9E8PKL21"
};
// === BƯỚC 2: KHỞI TẠO CÁC DỊCH VỤ ===
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app); // Google Analytics đã sẵn sàng chạy!

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("File không hợp lệ"));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- CẤU HÌNH FIREBASE ---
// CHÚ Ý: BẠN HÃY DÁN ĐOẠN MÃ FIREBASE CONFIG CỦA BẠN VÀO BÊN TRONG DẤU NGOẶC NHỌN DƯỚI ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyAqJzVPjstw570AfjzhTL9V-wBgrffqTAk",
  authDomain: "hieu-abfde.firebaseapp.com",
  projectId: "hieu-abfde",
  storageBucket: "hieu-abfde.firebasestorage.app",
  messagingSenderId: "643223090105",
  appId: "1:643223090105:web:39e8f00d1af0aae1e03c68",
  measurementId: "G-MW9E8PKL21"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-quiz-app';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentRole, setCurrentRole] = useState(null); 
  const [currentView, setCurrentView] = useState('auth'); 
  const [quizzes, setQuizzes] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [editingQuiz, setEditingQuiz] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [results, setResults] = useState([]);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState(null);
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);

  // ==========================================
  // KHỞI TẠO FIREBASE & DỮ LIỆU
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (!currentUser.emailVerified) {
          signOut(auth);
          setUser(null);
          setCurrentView('auth');
          setUserProfile(null);
          setCurrentRole(null);
          setLoadingAuth(false);
          return;
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setCurrentView('auth');
        setUserProfile(null);
        setCurrentRole(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.role) {
          setCurrentRole(data.role);
          setCurrentView(prev => (prev === 'auth' || prev === 'role-selection') ? 'dashboard' : prev);
        } else {
          setCurrentRole(null);
          setCurrentView('role-selection');
        }
      } else {
        setUserProfile({ email: user.email });
        setCurrentRole(null);
        setCurrentView('role-selection');
      }
    }, (err) => console.error("Lỗi tải Profile:", err));

    const quizzesRef = collection(db, 'artifacts', appId, 'public', 'data', 'quizzes');
    const unsubQuizzes = onSnapshot(quizzesRef, (snapshot) => {
      const loadedQuizzes = [];
      snapshot.forEach(doc => {
        loadedQuizzes.push({ id: doc.id, ...doc.data() });
      });
      loadedQuizzes.sort((a, b) => b.createdAt - a.createdAt);
      setQuizzes(loadedQuizzes);
    }, (err) => console.error("Lỗi tải đề thi:", err));

    const resultsRef = collection(db, 'artifacts', appId, 'public', 'data', 'quizResults');
    const unsubResults = onSnapshot(resultsRef, (snapshot) => {
      const loadedResults = [];
      snapshot.forEach(doc => {
        loadedResults.push({ id: doc.id, ...doc.data() });
      });
      loadedResults.sort((a, b) => b.createdAt - a.createdAt);
      setResults(loadedResults);
    }, (err) => console.error("Lỗi tải kết quả:", err));

    return () => {
      unsubProfile();
      unsubQuizzes();
      unsubResults();
    };
  }, [user]);

  // ==========================================
  // XỬ LÝ AUTHENTICATION
  // ==========================================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoadingAuth(true);

    try {
      if (authMode === 'register') {
        if (password !== confirmPassword) {
          setAuthError('Mật khẩu xác nhận không khớp!');
          setLoadingAuth(false);
          return;
        }
        if (password.length < 6) {
          setAuthError('Mật khẩu phải có ít nhất 6 ký tự!');
          setLoadingAuth(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await sendEmailVerification(newUser);
        
        const profileRef = doc(db, 'artifacts', appId, 'users', newUser.uid, 'profile', 'data');
        await setDoc(profileRef, { email: email, role: null }, { merge: true });

        await signOut(auth);
        setAuthError('');
        alert('ĐĂNG KÝ THÀNH CÔNG!\n\nHệ thống đã gửi một link xác minh đến email của bạn.\nVui lòng kiểm tra hộp thư đến (hoặc mục Thư Rác/Spam) và click vào link để kích hoạt tài khoản trước khi đăng nhập.');
        setAuthMode('login');
        setLoadingAuth(false);

      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setAuthError('Tài khoản chưa được kích hoạt!\nVui lòng kiểm tra hộp thư email (hoặc mục Thư Rác) của bạn để lấy link xác minh.');
          setLoadingAuth(false);
          return;
        }
      }
    } catch (err) {
      console.error("Lỗi xác thực:", err);
      if (err.code === 'auth/email-already-in-use') setAuthError('Email này đã được đăng ký!');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setAuthError('Email hoặc mật khẩu không chính xác!');
      else if (err.code === 'auth/too-many-requests') setAuthError('Tài khoản bị tạm khóa do nhập sai nhiều lần. Hãy thử lại sau.');
      else if (err.code === 'auth/operation-not-allowed') setAuthError('LỖI: Tính năng Đăng nhập bằng Email/Password chưa được bật. Vui lòng vào Firebase Console -> Authentication -> Sign-in method để Bật (Enable) nó lên.');
      else setAuthError('Lỗi mạng hoặc hệ thống. Vui lòng thử lại.');
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoadingAuth(true);
      await signOut(auth);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCurrentRole(null);
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
      setLoadingAuth(false);
    }
  };

  const handleSelectRole = async (role) => {
    if (!user) return;
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(profileRef, { role: role, email: user.email }, { merge: true });
    } catch (error) {
      console.error("Lỗi lưu vai trò:", error);
    }
  };

  // ==========================================
  // XỬ LÝ TẠO ĐỀ & HÌNH ẢNH (BẢN NÂNG CẤP)
  // ==========================================
  const startCreatingQuiz = () => {
    setEditingQuiz({
      id: Date.now().toString(), 
      title: '',
      questions: []
    });
    setErrorMsg("");
    setCurrentView('quiz-creator');
  };

  // 1. Thêm đoạn văn / hình ảnh dùng chung
  const addPassageToQuiz = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `p${Date.now()}`,
          isPassageOnly: true, // Đánh dấu đây là khối ngữ cảnh, không phải câu hỏi trắc nghiệm
          text: '',
          image: null
        }
      ]
    }));
  };

  // 2. Thêm câu hỏi trắc nghiệm bình thường
  const addQuestionToQuiz = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q${Date.now()}`,
          type: 'multiple-choice',
          text: '',
          image: null,
          options: [
            { id: 'A', text: '', image: null },
            { id: 'B', text: '', image: null },
            { id: 'C', text: '', image: null },
            { id: 'D', text: '', image: null }
          ],
          correctAnswer: ''
        }
      ]
    }));
  };

  // 3. TÍNH NĂNG MỚI: Thêm câu hỏi dạng điền từ / gõ chữ cái
  const addFillBlankQuestion = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q${Date.now()}`,
          type: 'fill-blank',
          text: '',
          image: null,
          correctAnswer: ''
        }
      ]
    }));
  };

  // Nâng cấp: Thêm / Bớt đáp án cho 1 câu hỏi
  const addOption = (qIndex) => {
    const updatedQuestions = [...editingQuiz.questions];
    const currentOptions = updatedQuestions[qIndex].options;
    if (currentOptions.length >= 10) {
      alert("Chỉ hỗ trợ tối đa 10 đáp án (A đến J)");
      return;
    }
    const nextChar = String.fromCharCode(65 + currentOptions.length); // A=65, B=66...
    currentOptions.push({ id: nextChar, text: '', image: null });
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const removeOption = (qIndex) => {
    const updatedQuestions = [...editingQuiz.questions];
    const currentOptions = updatedQuestions[qIndex].options;
    if (currentOptions.length <= 2) {
      alert("Một câu hỏi trắc nghiệm phải có ít nhất 2 đáp án!");
      return;
    }
    const removedId = currentOptions[currentOptions.length - 1].id;
    if (updatedQuestions[qIndex].correctAnswer === removedId) {
      updatedQuestions[qIndex].correctAnswer = ''; // Xóa luôn đáp án đúng nếu lỡ xóa trúng nó
    }
    currentOptions.pop();
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const handleImageUpload = async (e, qIndex, optIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        setErrorMsg("Vui lòng chọn file hình ảnh!");
        return;
    }
    try {
      const compressedBase64 = await compressImage(file);
      const updatedQuestions = [...editingQuiz.questions];
      if (optIndex !== null) {
        updatedQuestions[qIndex].options[optIndex].image = compressedBase64;
      } else {
        updatedQuestions[qIndex].image = compressedBase64;
      }
      setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
    } catch (err) {
      console.error("Lỗi nén ảnh tải lên:", err);
      alert("Đã xảy ra lỗi khi xử lý hình ảnh này.");
    }
    e.target.value = null;
  };

  const handlePasteImage = async (e, qIndex, optIndex = null) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    let imageFile = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break; 
      }
    }

    if (imageFile) {
      e.preventDefault(); 
      try {
        const compressedBase64 = await compressImage(imageFile);
        setEditingQuiz(prev => {
          const updatedQuestions = [...prev.questions];
          if (optIndex !== null) {
            updatedQuestions[qIndex].options[optIndex].image = compressedBase64;
          } else {
            updatedQuestions[qIndex].image = compressedBase64;
          }
          return { ...prev, questions: updatedQuestions };
        });
      } catch (err) {
        console.error("Lỗi xử lý ảnh dán:", err);
        alert("Lỗi: Không thể nhận diện ảnh dán này. Hãy thử ấn Windows + Shift + S để khoanh vùng ảnh rồi dán lại.");
      }
    }
  };

  const removeImage = (qIndex, optIndex = null) => {
    const updatedQuestions = [...editingQuiz.questions];
    if (optIndex !== null) {
      updatedQuestions[qIndex].options[optIndex].image = null;
    } else {
      updatedQuestions[qIndex].image = null;
    }
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const updateQuestionText = (qIndex, text) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[qIndex].text = text;
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[qIndex].options[optIndex].text = text;
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const setCorrectAnswer = (qIndex, optId) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[qIndex].correctAnswer = optId;
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const saveQuiz = async () => {
    setErrorMsg("");
    if (!editingQuiz.title.trim()) {
      setErrorMsg("Vui lòng nhập tên đề thi!");
      return;
    }
    // Lọc ra các câu hỏi thực sự (bỏ qua các khối đoạn văn/ngữ cảnh)
    const normalQuestions = editingQuiz.questions.filter(q => !q.isPassageOnly);
    
    if (normalQuestions.length === 0) {
      setErrorMsg("Vui lòng thêm ít nhất 1 câu hỏi có đáp án!");
      return;
    }
    const isAllValid = normalQuestions.every(q => {
      if (q.type === 'fill-blank') return q.correctAnswer.trim() !== '';
      return q.correctAnswer !== '';
    });
    if (!isAllValid) {
      setErrorMsg("Vui lòng điền/chọn đáp án đúng cho tất cả các câu hỏi!");
      return;
    }
    if (!user) return;

    try {
      const quizRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', editingQuiz.id);
      const quizData = {
        ...editingQuiz,
        createdAt: Date.now(),
        teacherId: user.uid,
        teacherEmail: user.email || 'Giảng viên'
      };
      
      await setDoc(quizRef, quizData);
      setCurrentView('dashboard');
      setEditingQuiz(null);
    } catch (error) {
      console.error("Lỗi khi lưu đề thi:", error);
      if (error.code === 'resource-exhausted' || error.message?.includes('exceeds the maximum')) {
         setErrorMsg("Lỗi: Đề thi có chứa quá nhiều hình ảnh, dung lượng vượt mức cho phép. Vui lòng chia nhỏ đề thi.");
      } else {
         setErrorMsg("Không thể lưu đề thi lên máy chủ do lỗi kết nối.");
      }
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId));
    } catch (error) {
      console.error("Lỗi xóa đề thi:", error);
    }
  };

  // ==========================================
  // XUẤT/NHẬP FILE ĐỀ THI
  // ==========================================
  const handleExportQuizzes = () => {
    const teacherQuizzes = quizzes.filter(q => q.teacherId === user?.uid);
    if (teacherQuizzes.length === 0) {
      alert("Bạn chưa có đề thi nào để xuất ra file!");
      return;
    }
    
    const dataStr = JSON.stringify(teacherQuizzes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_sach_de_thi_Backup_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
  };

  const handleImportQuizzes = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!Array.isArray(importedData)) throw new Error("File không đúng định dạng!");
        
        let successCount = 0;
        for (const quiz of importedData) {
          const quizId = quiz.id || Date.now().toString() + Math.floor(Math.random()*1000);
          const quizRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
          await setDoc(quizRef, {
            ...quiz,
            teacherId: user.uid,
            teacherEmail: user.email || 'Giảng viên import',
            createdAt: Date.now() 
          });
          successCount++;
        }
        alert(`Đã khôi phục thành công ${successCount} đề thi từ file lên hệ thống!`);
      } catch (error) {
        console.error("Lỗi đọc file:", error);
        alert("Lỗi: File không hợp lệ hoặc bị hỏng.");
      }
      event.target.value = null; 
    };
    reader.readAsText(file);
  };

  // ==========================================
  // CHỨC NĂNG CỦA SINH VIÊN
  // ==========================================
  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setStudentAnswers({});
    setIsQuizFinished(false);
    setCurrentView('quiz-taker');
  };

  const handleSelectAnswer = (qId, value, isTextInput = false) => {
    // Nếu là trắc nghiệm, khóa khi đã chọn. Nếu là gõ chữ thì cho phép sửa thoải mái.
    if (!isTextInput && studentAnswers[qId]) return;
    setStudentAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const finishQuiz = async () => {
    setIsQuizFinished(true);
    if (!user || currentRole !== 'student') return;

    const normalQuestions = activeQuiz.questions?.filter(q => !q.isPassageOnly) || [];
    let correctCount = 0;
    normalQuestions.forEach(q => {
      if (q.type === 'fill-blank') {
        const stuAns = studentAnswers[q.id] || '';
        if (stuAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correctCount++;
        }
      } else {
        if (studentAnswers[q.id] === q.correctAnswer) correctCount++;
      }
    });

    try {
      const resultId = `${user.uid}_${activeQuiz.id}_${Date.now()}`;
      const resultRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizResults', resultId);
      await setDoc(resultRef, {
        quizId: activeQuiz.id,
        studentId: user.uid,
        studentEmail: userProfile?.email || user.email || 'Sinh viên',
        score: correctCount,
        total: normalQuestions.length,
        answers: studentAnswers,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Lỗi khi nộp bài lên hệ thống:", error);
    }
  };

  // ==========================================
  // GIAO DIỆN HIỂN THỊ
  // ==========================================
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-blue-600 bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-semibold text-lg">Đang kết nối hệ thống...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz System</h1>
            <p className="text-gray-500">
              {authMode === 'login' ? 'Đăng nhập vào tài khoản của bạn' : 'Đăng ký tài khoản mới'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-200">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="vidu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    required
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors mt-2 shadow-md"
            >
              {authMode === 'login' ? <><LogIn size={20}/> Đăng Nhập</> : <><UserPlus size={20}/> Tạo Tài Khoản</>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            {authMode === 'login' ? (
              <p className="text-gray-600">
                Bạn chưa có tài khoản?{' '}
                <button type="button" onClick={() => {setAuthMode('register'); setAuthError('');}} className="text-blue-600 font-bold hover:underline">
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => {setAuthMode('login'); setAuthError('');}} className="text-blue-600 font-bold hover:underline">
                  Quay lại đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'role-selection') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center">Thiết lập tài khoản</h1>
        <p className="text-gray-600 mb-8">Xin chào <span className="font-bold">{user?.email}</span>. Vui lòng chọn vai trò của bạn.</p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={() => handleSelectRole('teacher')}
            className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all group w-64 flex flex-col items-center"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
              <UserCircle size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Giảng Viên</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Tạo đề thi, soạn câu hỏi và chia sẻ cho sinh viên.</p>
          </button>

          <button 
            onClick={() => handleSelectRole('student')}
            className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 transition-all group w-64 flex flex-col items-center"
          >
            <div className="bg-green-100 p-4 rounded-full mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors text-green-600">
              <GraduationCap size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Sinh Viên</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Xem danh sách vòng thi và làm bài trực tuyến.</p>
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              {currentRole === 'teacher' ? <UserCircle size={40} className="text-blue-600" /> : <GraduationCap size={40} className="text-green-600" />}
              <div>
                <span className="font-bold text-gray-800 block text-lg">
                  {currentRole === 'teacher' ? 'Bảng Điều Khiển Giảng Viên' : 'Trang Thi Sinh Viên'}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail size={14}/> {user?.email}
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-semibold transition"
            >
              Đăng xuất
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Danh sách đề thi</h2>
            {currentRole === 'teacher' && (
              <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                <button 
                  onClick={handleExportQuizzes}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-300 shadow-sm text-sm"
                  title="Tải toàn bộ đề thi của bạn về máy tính"
                >
                  <Download size={16} /> Xuất
                </button>
                
                <label className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-300 shadow-sm cursor-pointer text-sm" title="Khôi phục đề thi từ file .json">
                  <Upload size={16} /> Nhập
                  <input type="file" accept=".json" onChange={handleImportQuizzes} className="hidden" />
                </label>

                <button 
                  onClick={startCreatingQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <PlusCircle size={20} /> Tạo Mới
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.length === 0 ? (
              <div className="col-span-full text-center p-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
                <p>Hệ thống hiện tại chưa có đề thi nào.</p>
                {currentRole === 'teacher' && <p className="text-sm mt-2 text-blue-600">Hãy nhấn "Tạo Mới" để bắt đầu thiết kế bài tập!</p>}
              </div>
            ) : (
              quizzes.map((quiz, idx) => {
                const normalQuestions = quiz.questions?.filter(q => !q.isPassageOnly) || [];
                return (
                  <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between relative group hover:shadow-md transition">
                    {currentRole === 'teacher' && quiz.teacherId === user?.uid && (
                      <button 
                        onClick={() => { if(window.confirm('Bạn có chắc chắn muốn xóa đề thi này khỏi hệ thống?')) handleDeleteQuiz(quiz.id); }}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-full p-1 z-10"
                        title="Xóa đề thi"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <div className="mb-6">
                      <div className="text-xs font-bold text-blue-600 mb-1 tracking-wider uppercase">Vòng thi số {quizzes.length - idx}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 pr-8 line-clamp-2">{quiz.title}</h3>
                      <div className="flex flex-col gap-1 mt-3">
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <BookOpen size={16} /> Bao gồm {normalQuestions.length} câu hỏi
                        </p>
                        {currentRole === 'teacher' && quiz.teacherId === user?.uid && (
                          <p className="text-gray-500 text-sm flex items-center gap-2">
                            <Users size={16} /> Lượt nộp bài: <span className="font-bold text-blue-600">{results.filter(r => r.quizId === quiz.id).length}</span>
                          </p>
                        )}
                        {currentRole === 'student' && quiz.teacherEmail && (
                          <p className="text-gray-400 text-xs flex items-center gap-2">
                            <UserCircle size={14} /> GV: {quiz.teacherEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {currentRole === 'student' ? (
                      <button 
                        onClick={() => startQuiz(quiz)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
                      >
                        <PlayCircle size={20} /> Bắt Đầu Làm Bài
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedQuizForResults(quiz);
                          setCurrentView('quiz-results');
                        }}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-sm border border-blue-200"
                      >
                        <BarChart2 size={20} /> Xem Kết Quả Sinh Viên
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz-creator' && editingQuiz) {
    let questionCounter = 0; // Bộ đếm cho câu hỏi thật sự
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => {
              if (editingQuiz.questions.length > 0 && !window.confirm('Bạn có chắc muốn hủy? Các câu hỏi chưa lưu sẽ bị mất.')) return;
              setCurrentView('dashboard');
            }}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Quay lại danh sách
          </button>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-200 shadow-sm animate-pulse">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Tiêu đề vòng thi / Đề thi</h2>
            <input 
              type="text" 
              placeholder="Ví dụ: Kiểm tra Tiếng Anh - Reading Part 6..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-medium transition"
              value={editingQuiz.title}
              onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
            />
          </div>

          <div className="space-y-6">
            {editingQuiz.questions.map((q, qIndex) => {
              // --- NẾU LÀ KHỐI BÀI ĐỌC (PASSAGE) ---
              if (q.isPassageOnly) {
                return (
                  <div key={q.id} className="bg-blue-50 p-6 rounded-xl shadow-sm border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-blue-800 bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-wider text-sm">
                        <FileText size={18}/> Ngữ cảnh / Bài đọc (Dùng chung cho các câu dưới)
                      </div>
                      <button 
                        onClick={() => {
                          const newQuestions = editingQuiz.questions.filter((_, i) => i !== qIndex);
                          setEditingQuiz({...editingQuiz, questions: newQuestions});
                        }}
                        className="text-gray-400 hover:text-red-500 transition bg-white p-1.5 rounded-md shadow-sm"
                        title="Xóa khối ngữ cảnh này"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="relative mb-2">
                      <textarea 
                        placeholder="Nhập nội dung bài đọc hoặc dán hình ảnh đoạn văn (Ctrl+V) vào đây..."
                        className="w-full p-4 pb-8 border border-blue-300 rounded-lg min-h-[120px] outline-none focus:border-blue-500 transition bg-white"
                        value={q.text}
                        onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                        onPaste={(e) => handlePasteImage(e, qIndex)}
                      />
                      <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-blue-600 transition" title="Chọn ảnh từ máy tính">
                        <ImageIcon size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, qIndex)} />
                      </label>
                    </div>

                    {q.image && (
                      <div className="relative inline-block mt-2 border-2 border-blue-200 rounded-lg p-2 bg-white shadow-sm">
                        <img src={q.image} alt="Ảnh bài đọc" className="max-h-64 object-contain rounded" />
                        <button onClick={() => removeImage(qIndex)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // --- NẾU LÀ CÂU HỎI TRẮC NGHIỆM BÌNH THƯỜNG ---
              questionCounter++;
              return (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded">Câu hỏi số {questionCounter}</div>
                    <button 
                      onClick={() => {
                        const newQuestions = editingQuiz.questions.filter((_, i) => i !== qIndex);
                        setEditingQuiz({...editingQuiz, questions: newQuestions});
                      }}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="relative mb-4">
                    <textarea 
                      placeholder="Nhập câu hỏi (Ví dụ: 27, hoặc dán ảnh vào đây)..."
                      className="w-full p-3 pb-8 border border-gray-300 rounded-lg min-h-[80px] outline-none focus:border-blue-500 transition"
                      value={q.text}
                      onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                      onPaste={(e) => handlePasteImage(e, qIndex)}
                    />
                    <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-blue-600 transition" title="Chọn ảnh từ máy tính">
                      <ImageIcon size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, qIndex)} />
                    </label>
                  </div>

                  {q.image && (
                    <div className="relative inline-block mb-4 border border-gray-200 rounded p-2 bg-gray-50">
                      <img src={q.image} alt="Ảnh câu hỏi" className="max-h-48 object-contain rounded" />
                      <button onClick={() => removeImage(qIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* PHẦN GIAO DIỆN ĐÁP ÁN: Tùy thuộc vào loại câu hỏi */}
                  {q.type === 'fill-blank' ? (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Nhập đáp án đúng (Sinh viên sẽ phải gõ chính xác chữ này để được điểm):</p>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: H, A, hoặc nhập một từ tiếng Anh..."
                        className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none text-lg font-bold text-gray-800"
                        value={q.correctAnswer}
                        onChange={(e) => setCorrectAnswer(qIndex, e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Nhập đáp án và <span className="text-green-600 font-bold underline">tích vào ô vuông đầu dòng</span> để chọn đáp án đúng:</p>
                        {q.options.map((opt, optIndex) => (
                          <div key={opt.id} className={`flex items-start gap-3 p-2 border rounded-lg transition-colors ${q.correctAnswer === opt.id ? 'bg-green-50 border-green-400 shadow-inner' : 'border-gray-200'}`}>
                            <div 
                              onClick={() => setCorrectAnswer(qIndex, opt.id)}
                              className={`mt-1 w-7 h-7 flex-shrink-0 rounded-md flex items-center justify-center cursor-pointer transition-all ${q.correctAnswer === opt.id ? 'bg-green-500 scale-110' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="Click để đánh dấu đây là đáp án đúng"
                            >
                              {q.correctAnswer === opt.id && <CheckCircle2 size={18} className="text-white" />}
                            </div>
                            
                            <span className="font-bold text-gray-600 w-6 text-center mt-1.5">{opt.id}.</span>
                            
                            <div className="flex-grow relative flex flex-col gap-2">
                              <div className="relative w-full">
                                <input 
                                  type="text" 
                                  placeholder={`Nội dung đáp án ${opt.id}...`}
                                  className="w-full p-2 pr-8 bg-transparent outline-none focus:border-b-2 focus:border-blue-500 transition border-b border-transparent"
                                  value={opt.text}
                                  onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                                  onPaste={(e) => handlePasteImage(e, qIndex, optIndex)}
                                />
                                <label className="absolute right-1 top-2.5 cursor-pointer text-gray-400 hover:text-blue-600 transition" title="Chọn ảnh từ máy tính">
                                  <ImageIcon size={18} />
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, qIndex, optIndex)} />
                                </label>
                              </div>
                              {opt.image && (
                                <div className="relative inline-block border border-gray-200 rounded p-1 w-max bg-white shadow-sm">
                                  <img src={opt.image} alt={`Ảnh đáp án ${opt.id}`} className="max-h-24 object-contain rounded" />
                                  <button onClick={() => removeImage(qIndex, optIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow">
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Nút thêm bớt đáp án động */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                         <button onClick={() => addOption(qIndex)} className="text-sm text-blue-600 font-semibold hover:text-blue-800 transition">+ Thêm đáp án ({String.fromCharCode(65 + q.options.length)})</button>
                         {q.options.length > 2 && (
                           <button onClick={() => removeOption(qIndex)} className="text-sm text-red-500 font-semibold hover:text-red-700 transition">- Bớt đáp án cuối</button>
                         )}
                      </div>
                    </>
                  )}

                  {q.correctAnswer === '' && (
                    <p className="text-red-500 text-sm mt-3 flex items-center"><AlertCircle size={14} className="mr-1"/> Vui lòng chọn/điền đáp án đúng cho câu hỏi này</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 flex-wrap">
            <button 
              onClick={addPassageToQuiz}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 py-3 px-4 rounded-xl font-bold flex-1 border border-blue-200 flex items-center justify-center gap-2 transition min-w-[150px]"
            >
              <FileText size={20} /> Chèn Bài Đọc
            </button>
            <button 
              onClick={addQuestionToQuiz}
              className="bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-bold flex-1 border border-dashed border-gray-400 flex items-center justify-center gap-2 transition min-w-[180px]"
            >
              <PlusCircle size={20} /> Câu Trắc Nghiệm
            </button>
            <button 
              onClick={addFillBlankQuestion}
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 py-3 px-4 rounded-xl font-bold flex-1 border border-dashed border-yellow-400 flex items-center justify-center gap-2 transition min-w-[180px]"
            >
              <PlusCircle size={20} /> Câu Điền Chữ
            </button>
            <button 
              onClick={saveQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-bold w-full sm:w-auto shadow-md flex items-center justify-center gap-2 transition"
            >
              <Save size={20} /> Lưu Đề Thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz-taker' && activeQuiz) {
    const normalQuestions = activeQuiz.questions?.filter(q => !q.isPassageOnly) || [];
    const totalQ = normalQuestions.length;
    const answeredCount = Object.keys(studentAnswers).length;
    
    let correctCount = 0;
    if (isQuizFinished) {
      normalQuestions.forEach(q => {
        if (q.type === 'fill-blank') {
          const stuAns = studentAnswers[q.id] || '';
          if (stuAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            correctCount++;
          }
        } else {
          if (studentAnswers[q.id] === q.correctAnswer) correctCount++;
        }
      });
    }

    let questionCounter = 0; // Để sinh viên xem đúng số thứ tự

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sticky top-4 z-10 border-t-4 border-green-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{activeQuiz.title}</h2>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(answeredCount / (totalQ || 1)) * 100}%` }}></div>
              </div>
              <p className="text-gray-500 text-xs font-medium">Tiến độ: Đã trả lời {answeredCount}/{totalQ} câu</p>
            </div>
            {!isQuizFinished ? (
               <button 
                onClick={finishQuiz}
                disabled={answeredCount < totalQ}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold transition-all ${answeredCount === totalQ && totalQ > 0 ? 'bg-green-600 text-white shadow-md hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Nộp Bài
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition"
              >
                <ArrowLeft size={18}/> Về Trang Chủ
              </button>
            )}
          </div>

          {isQuizFinished && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-8 text-center animate-fade-in-up">
              <h3 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">Chúc mừng bạn đã hoàn thành bài thi!</h3>
              <p className="text-lg text-green-800">
                Điểm số của bạn: <span className="text-4xl font-black text-green-600 mx-2">{correctCount}/{totalQ}</span> câu đúng.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {activeQuiz.questions?.map((q, index) => {
              if (q.isPassageOnly) {
                return (
                  <div key={q.id} className="bg-blue-50 rounded-xl shadow-sm border-l-4 border-blue-500 p-5 sm:p-8 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold uppercase tracking-wider text-sm">
                      <FileText size={18}/> Ngữ cảnh / Bài đọc
                    </div>
                    {q.text && <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">{q.text}</p>}
                    {q.image && <img src={q.image} alt="Bài đọc" className="mt-4 w-full rounded-lg shadow-sm border border-blue-200 object-contain bg-white" />}
                  </div>
                );
              }

              questionCounter++;
              const selectedAns = studentAnswers[q.id];
              // Đối với câu trắc nghiệm, nếu đã ấn chọn thì là đã trả lời. Đối với điền từ thì không giới hạn cho đến khi Nộp bài.
              const isAnswered = q.type === 'fill-blank' ? isQuizFinished : !!selectedAns;
              
              let isCorrect = false;
              if (q.type === 'fill-blank') {
                isCorrect = selectedAns?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              } else {
                isCorrect = selectedAns === q.correctAnswer;
              }

              return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800 text-lg leading-relaxed">
                        <span className="text-green-600 mr-2">Câu {questionCounter}:</span>
                        {q.text}
                      </h3>
                      {q.image && (
                        <img src={q.image} alt="Ảnh câu hỏi" className="mt-4 max-h-72 rounded-lg shadow-sm border border-gray-200 object-contain bg-gray-50" />
                      )}
                    </div>
                    
                    {isQuizFinished && (
                       <span className={`flex-shrink-0 flex items-center text-sm font-bold px-3 py-1 rounded-full ${!selectedAns || selectedAns.trim() === '' ? 'bg-gray-100 text-gray-500' : isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {!selectedAns || selectedAns.trim() === '' ? 'Bỏ trống' : isCorrect ? <><CheckCircle2 size={16} className="mr-1"/> Chính xác</> : <><XCircle size={16} className="mr-1"/> Sai</>}
                       </span>
                    )}
                  </div>

                  <div className="space-y-3 mt-4">
                    {q.type === 'fill-blank' ? (
                      <div className="mt-2">
                        <input 
                          type="text" 
                          disabled={isQuizFinished}
                          placeholder="Gõ đáp án của bạn vào đây..."
                          className={`w-full p-4 text-lg border-2 rounded-xl outline-none transition font-bold ${isQuizFinished ? (isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900') : 'border-gray-300 focus:border-blue-500 text-gray-800'}`}
                          value={selectedAns || ''}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value, true)}
                        />
                        {isQuizFinished && !isCorrect && (
                          <div className="mt-3 p-3 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm flex items-center gap-2">
                            <span className="font-bold">Đáp án đúng là:</span> <span className="text-lg font-black">{q.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      q.options.map(opt => {
                        let btnStyle = "border-gray-200 hover:bg-gray-50 hover:border-gray-300";
                        let icon = null;

                        if (isQuizFinished || selectedAns) {
                          if (opt.id === q.correctAnswer && isQuizFinished) {
                            btnStyle = "border-green-500 bg-green-50 text-green-900 ring-2 ring-green-500 shadow-sm";
                            icon = <CheckCircle2 className="text-green-600 flex-shrink-0" size={22} />;
                          } else if (opt.id === selectedAns) {
                            if (!isQuizFinished) {
                               btnStyle = "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500";
                            } else if (!isCorrect) {
                               btnStyle = "border-red-500 bg-red-50 text-red-900 opacity-90";
                               icon = <XCircle className="text-red-500 flex-shrink-0" size={22} />;
                            }
                          } else {
                            btnStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={opt.id}
                            disabled={isAnswered || isQuizFinished}
                            onClick={() => handleSelectAnswer(q.id, opt.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 flex justify-between items-center transition-all duration-200 ${!isQuizFinished && !isAnswered ? 'cursor-pointer hover:shadow-sm transform hover:-translate-y-0.5' : 'cursor-default'} ${btnStyle}`}
                          >
                            <div className="flex flex-col flex-grow pr-4">
                              <div className="flex items-start">
                                <span className="font-bold w-8 flex-shrink-0 mt-0.5">{opt.id}.</span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>
                              {opt.image && (
                                <img src={opt.image} alt={`Ảnh đáp án ${opt.id}`} className="mt-3 ml-8 max-h-32 rounded border border-gray-200 object-contain self-start bg-white shadow-sm" />
                              )}
                            </div>
                            {icon}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz-results' && selectedQuizForResults) {
    const quizResults = results.filter(r => r.quizId === selectedQuizForResults.id);

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Quay lại danh sách đề
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-t-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thống kê: {selectedQuizForResults.title}</h2>
            <div className="flex gap-4 text-gray-600">
              <span className="flex items-center gap-1"><Users size={18}/> {quizResults.length} lượt nộp bài</span>
              <span className="flex items-center gap-1"><BookOpen size={18}/> {(selectedQuizForResults.questions?.filter(q => !q.isPassageOnly) || []).length} câu hỏi</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {quizResults.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <BarChart2 size={48} className="mx-auto text-gray-300 mb-3"/>
                <p>Chưa có sinh viên nào làm bài thi này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <th className="p-4 font-bold">Email Sinh Viên</th>
                      <th className="p-4 font-bold">Điểm Số</th>
                      <th className="p-4 font-bold">Thời Gian Nộp</th>
                      <th className="p-4 font-bold text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizResults.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-800">{r.studentEmail}</td>
                        <td className="p-4">
                          <span className={`font-bold px-2 py-1 rounded ${r.score >= (r.total / 2) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {r.score} / {r.total}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14}/> {new Date(r.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedStudentResult(r);
                              setCurrentView('student-result-detail');
                            }}
                            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center justify-end gap-1 ml-auto font-medium transition"
                          >
                            <Eye size={16}/> Xem bài làm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'student-result-detail' && selectedStudentResult && selectedQuizForResults) {
    const studentAns = selectedStudentResult.answers || {};
    let questionCounter = 0;
    
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setCurrentView('quiz-results')}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Quay lại danh sách kết quả
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-t-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Chi tiết bài làm: {selectedQuizForResults.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Sinh viên</p>
                <p className="font-bold flex items-center gap-2"><UserCircle size={18} className="text-blue-500"/> {selectedStudentResult.studentEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Điểm số</p>
                <p className={`font-bold text-lg ${selectedStudentResult.score >= (selectedStudentResult.total / 2) ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStudentResult.score} / {selectedStudentResult.total}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedQuizForResults.questions?.map((q, index) => {
              if (q.isPassageOnly) {
                 return (
                   <div key={q.id} className="bg-blue-50 rounded-xl shadow-sm border-l-4 border-blue-500 p-5 mb-2">
                      <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold uppercase tracking-wider text-sm">
                         <FileText size={18}/> Ngữ cảnh / Bài đọc
                      </div>
                      {q.text && <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{q.text}</p>}
                      {q.image && <img src={q.image} alt="Bài đọc" className="mt-3 max-h-64 rounded-lg shadow-sm border border-blue-200 object-contain bg-white" />}
                   </div>
                 );
              }

              questionCounter++;
              const selectedByStudent = studentAns[q.id] || '';
              
              let isCorrect = false;
              if (q.type === 'fill-blank') {
                isCorrect = selectedByStudent.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              } else {
                isCorrect = selectedByStudent === q.correctAnswer;
              }
              const isUnanswered = !selectedByStudent || selectedByStudent.trim() === '';

              return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800 text-lg leading-relaxed">
                        <span className="text-blue-600 mr-2">Câu {questionCounter}:</span>
                        {q.text}
                      </h3>
                      {q.image && (
                        <img src={q.image} alt="Ảnh câu hỏi" className="mt-4 max-h-72 rounded-lg shadow-sm border border-gray-200 object-contain bg-gray-50" />
                      )}
                    </div>
                    
                    <span className={`flex-shrink-0 flex items-center text-sm font-bold px-3 py-1 rounded-full ${isUnanswered ? 'bg-gray-100 text-gray-500' : isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isUnanswered ? 'Bỏ trống' : isCorrect ? <><CheckCircle2 size={16} className="mr-1"/> Đúng</> : <><XCircle size={16} className="mr-1"/> Sai</>}
                    </span>
                  </div>

                  {q.type === 'fill-blank' ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Sinh viên đã gõ:</p>
                        <p className={`text-lg font-bold ${isUnanswered ? 'text-gray-400' : isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                           {isUnanswered ? '(Không làm)' : selectedByStudent}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600 font-semibold mb-1">Đáp án của bạn:</p>
                        <p className="text-lg font-bold text-green-800 uppercase">{q.correctAnswer}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {q.options.map(opt => {
                        let btnStyle = "border-gray-200 bg-white";
                        let icon = null;

                        if (opt.id === q.correctAnswer) {
                          btnStyle = "border-green-400 bg-green-50 ring-1 ring-green-400";
                          icon = <CheckCircle2 className="text-green-600 flex-shrink-0" size={22} />;
                        } else if (opt.id === selectedByStudent && !isCorrect) {
                          btnStyle = "border-red-400 bg-red-50 opacity-90";
                          icon = <XCircle className="text-red-500 flex-shrink-0" size={22} />;
                        } else {
                          btnStyle = "border-gray-100 bg-gray-50 opacity-50";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`w-full text-left p-4 rounded-xl border-2 flex justify-between items-center ${btnStyle}`}
                          >
                            <div className="flex flex-col flex-grow pr-4 text-gray-700">
                              <div className="flex items-start">
                                <span className="font-bold w-8 flex-shrink-0 mt-0.5">{opt.id}.</span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>
                              {opt.image && (
                                <img src={opt.image} alt={`Ảnh đáp án ${opt.id}`} className="mt-3 ml-8 max-h-32 rounded border border-gray-200 object-contain self-start bg-white shadow-sm" />
                              )}
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
=======
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, UserCircle, GraduationCap, 
  PlusCircle, Save, ArrowLeft, BookOpen, PlayCircle, 
  AlertCircle, Trash2, Loader2, Mail, Lock, LogIn, UserPlus,
  Download, Upload, Image as ImageIcon, X,
  BarChart2, Eye, Users, Calendar, FileText
} from 'lucide-react';

// --- TIỆN ÍCH XỬ LÝ HÌNH ẢNH MẠNH MẼ ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("File không hợp lệ"));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- CẤU HÌNH FIREBASE ---
// CHÚ Ý: BẠN HÃY DÁN ĐOẠN MÃ FIREBASE CONFIG CỦA BẠN VÀO BÊN TRONG DẤU NGOẶC NHỌN DƯỚI ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyAqJzVPjstw570AfjzhTL9V-wBgrffqTAk",
  authDomain: "hieu-abfde.firebaseapp.com",
  projectId: "hieu-abfde",
  storageBucket: "hieu-abfde.firebasestorage.app",
  messagingSenderId: "643223090105",
  appId: "1:643223090105:web:39e8f00d1af0aae1e03c68",
  measurementId: "G-MW9E8PKL21"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-quiz-app';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentRole, setCurrentRole] = useState(null); 
  const [currentView, setCurrentView] = useState('auth'); 
  const [quizzes, setQuizzes] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [editingQuiz, setEditingQuiz] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [results, setResults] = useState([]);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState(null);
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);

  // ==========================================
  // KHỞI TẠO FIREBASE & DỮ LIỆU
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (!currentUser.emailVerified) {
          signOut(auth);
          setUser(null);
          setCurrentView('auth');
          setUserProfile(null);
          setCurrentRole(null);
          setLoadingAuth(false);
          return;
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setCurrentView('auth');
        setUserProfile(null);
        setCurrentRole(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.role) {
          setCurrentRole(data.role);
          setCurrentView(prev => (prev === 'auth' || prev === 'role-selection') ? 'dashboard' : prev);
        } else {
          setCurrentRole(null);
          setCurrentView('role-selection');
        }
      } else {
        setUserProfile({ email: user.email });
        setCurrentRole(null);
        setCurrentView('role-selection');
      }
    }, (err) => console.error("Lỗi tải Profile:", err));

    const quizzesRef = collection(db, 'artifacts', appId, 'public', 'data', 'quizzes');
    const unsubQuizzes = onSnapshot(quizzesRef, (snapshot) => {
      const loadedQuizzes = [];
      snapshot.forEach(doc => {
        loadedQuizzes.push({ id: doc.id, ...doc.data() });
      });
      loadedQuizzes.sort((a, b) => b.createdAt - a.createdAt);
      setQuizzes(loadedQuizzes);
    }, (err) => console.error("Lỗi tải đề thi:", err));

    const resultsRef = collection(db, 'artifacts', appId, 'public', 'data', 'quizResults');
    const unsubResults = onSnapshot(resultsRef, (snapshot) => {
      const loadedResults = [];
      snapshot.forEach(doc => {
        loadedResults.push({ id: doc.id, ...doc.data() });
      });
      loadedResults.sort((a, b) => b.createdAt - a.createdAt);
      setResults(loadedResults);
    }, (err) => console.error("Lỗi tải kết quả:", err));

    return () => {
      unsubProfile();
      unsubQuizzes();
      unsubResults();
    };
  }, [user]);

  // ==========================================
  // XỬ LÝ AUTHENTICATION
  // ==========================================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoadingAuth(true);

    try {
      if (authMode === 'register') {
        if (password !== confirmPassword) {
          setAuthError('Mật khẩu xác nhận không khớp!');
          setLoadingAuth(false);
          return;
        }
        if (password.length < 6) {
          setAuthError('Mật khẩu phải có ít nhất 6 ký tự!');
          setLoadingAuth(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await sendEmailVerification(newUser);
        
        const profileRef = doc(db, 'artifacts', appId, 'users', newUser.uid, 'profile', 'data');
        await setDoc(profileRef, { email: email, role: null }, { merge: true });

        await signOut(auth);
        setAuthError('');
        alert('ĐĂNG KÝ THÀNH CÔNG!\n\nHệ thống đã gửi một link xác minh đến email của bạn.\nVui lòng kiểm tra hộp thư đến (hoặc mục Thư Rác/Spam) và click vào link để kích hoạt tài khoản trước khi đăng nhập.');
        setAuthMode('login');
        setLoadingAuth(false);

      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setAuthError('Tài khoản chưa được kích hoạt!\nVui lòng kiểm tra hộp thư email (hoặc mục Thư Rác) của bạn để lấy link xác minh.');
          setLoadingAuth(false);
          return;
        }
      }
    } catch (err) {
      console.error("Lỗi xác thực:", err);
      if (err.code === 'auth/email-already-in-use') setAuthError('Email này đã được đăng ký!');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setAuthError('Email hoặc mật khẩu không chính xác!');
      else if (err.code === 'auth/too-many-requests') setAuthError('Tài khoản bị tạm khóa do nhập sai nhiều lần. Hãy thử lại sau.');
      else if (err.code === 'auth/operation-not-allowed') setAuthError('LỖI: Tính năng Đăng nhập bằng Email/Password chưa được bật. Vui lòng vào Firebase Console -> Authentication -> Sign-in method để Bật (Enable) nó lên.');
      else setAuthError('Lỗi mạng hoặc hệ thống. Vui lòng thử lại.');
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoadingAuth(true);
      await signOut(auth);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCurrentRole(null);
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
      setLoadingAuth(false);
    }
  };

  const handleSelectRole = async (role) => {
    if (!user) return;
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(profileRef, { role: role, email: user.email }, { merge: true });
    } catch (error) {
      console.error("Lỗi lưu vai trò:", error);
    }
  };

  // ==========================================
  // XỬ LÝ TẠO ĐỀ & HÌNH ẢNH (BẢN NÂNG CẤP)
  // ==========================================
  const startCreatingQuiz = () => {
    setEditingQuiz({
      id: Date.now().toString(), 
      title: '',
      questions: []
    });
    setErrorMsg("");
    setCurrentView('quiz-creator');
  };

  // 1. Thêm đoạn văn / hình ảnh dùng chung
  const addPassageToQuiz = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `p${Date.now()}`,
          isPassageOnly: true, // Đánh dấu đây là khối ngữ cảnh, không phải câu hỏi trắc nghiệm
          text: '',
          image: null
        }
      ]
    }));
  };

  // 2. Thêm câu hỏi trắc nghiệm bình thường
  const addQuestionToQuiz = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q${Date.now()}`,
          type: 'multiple-choice',
          text: '',
          image: null,
          options: [
            { id: 'A', text: '', image: null },
            { id: 'B', text: '', image: null },
            { id: 'C', text: '', image: null },
            { id: 'D', text: '', image: null }
          ],
          correctAnswer: ''
        }
      ]
    }));
  };

  // 3. TÍNH NĂNG MỚI: Thêm câu hỏi dạng điền từ / gõ chữ cái
  const addFillBlankQuestion = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q${Date.now()}`,
          type: 'fill-blank',
          text: '',
          image: null,
          correctAnswer: ''
        }
      ]
    }));
  };

  // Nâng cấp: Thêm / Bớt đáp án cho 1 câu hỏi
  const addOption = (qIndex) => {
    const updatedQuestions = [...editingQuiz.questions];
    const currentOptions = updatedQuestions[qIndex].options;
    if (currentOptions.length >= 10) {
      alert("Chỉ hỗ trợ tối đa 10 đáp án (A đến J)");
      return;
    }
    const nextChar = String.fromCharCode(65 + currentOptions.length); // A=65, B=66...
    currentOptions.push({ id: nextChar, text: '', image: null });
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const removeOption = (qIndex) => {
    const updatedQuestions = [...editingQuiz.questions];
    const currentOptions = updatedQuestions[qIndex].options;
    if (currentOptions.length <= 2) {
      alert("Một câu hỏi trắc nghiệm phải có ít nhất 2 đáp án!");
      return;
    }
    const removedId = currentOptions[currentOptions.length - 1].id;
    if (updatedQuestions[qIndex].correctAnswer === removedId) {
      updatedQuestions[qIndex].correctAnswer = ''; // Xóa luôn đáp án đúng nếu lỡ xóa trúng nó
    }
    currentOptions.pop();
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const handleImageUpload = async (e, qIndex, optIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        setErrorMsg("Vui lòng chọn file hình ảnh!");
        return;
    }
    try {
      const compressedBase64 = await compressImage(file);
      const updatedQuestions = [...editingQuiz.questions];
      if (optIndex !== null) {
        updatedQuestions[qIndex].options[optIndex].image = compressedBase64;
      } else {
        updatedQuestions[qIndex].image = compressedBase64;
      }
      setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
    } catch (err) {
      console.error("Lỗi nén ảnh tải lên:", err);
      alert("Đã xảy ra lỗi khi xử lý hình ảnh này.");
    }
    e.target.value = null;
  };

  const handlePasteImage = async (e, qIndex, optIndex = null) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    let imageFile = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break; 
      }
    }

    if (imageFile) {
      e.preventDefault(); 
      try {
        const compressedBase64 = await compressImage(imageFile);
        setEditingQuiz(prev => {
          const updatedQuestions = [...prev.questions];
          if (optIndex !== null) {
            updatedQuestions[qIndex].options[optIndex].image = compressedBase64;
          } else {
            updatedQuestions[qIndex].image = compressedBase64;
          }
          return { ...prev, questions: updatedQuestions };
        });
      } catch (err) {
        console.error("Lỗi xử lý ảnh dán:", err);
        alert("Lỗi: Không thể nhận diện ảnh dán này. Hãy thử ấn Windows + Shift + S để khoanh vùng ảnh rồi dán lại.");
      }
    }
  };

  const removeImage = (qIndex, optIndex = null) => {
    const updatedQuestions = [...editingQuiz.questions];
    if (optIndex !== null) {
      updatedQuestions[qIndex].options[optIndex].image = null;
    } else {
      updatedQuestions[qIndex].image = null;
    }
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const updateQuestionText = (qIndex, text) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[qIndex].text = text;
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[qIndex].options[optIndex].text = text;
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const setCorrectAnswer = (qIndex, optId) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[qIndex].correctAnswer = optId;
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const saveQuiz = async () => {
    setErrorMsg("");
    if (!editingQuiz.title.trim()) {
      setErrorMsg("Vui lòng nhập tên đề thi!");
      return;
    }
    // Lọc ra các câu hỏi thực sự (bỏ qua các khối đoạn văn/ngữ cảnh)
    const normalQuestions = editingQuiz.questions.filter(q => !q.isPassageOnly);
    
    if (normalQuestions.length === 0) {
      setErrorMsg("Vui lòng thêm ít nhất 1 câu hỏi có đáp án!");
      return;
    }
    const isAllValid = normalQuestions.every(q => {
      if (q.type === 'fill-blank') return q.correctAnswer.trim() !== '';
      return q.correctAnswer !== '';
    });
    if (!isAllValid) {
      setErrorMsg("Vui lòng điền/chọn đáp án đúng cho tất cả các câu hỏi!");
      return;
    }
    if (!user) return;

    try {
      const quizRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', editingQuiz.id);
      const quizData = {
        ...editingQuiz,
        createdAt: Date.now(),
        teacherId: user.uid,
        teacherEmail: user.email || 'Giảng viên'
      };
      
      await setDoc(quizRef, quizData);
      setCurrentView('dashboard');
      setEditingQuiz(null);
    } catch (error) {
      console.error("Lỗi khi lưu đề thi:", error);
      if (error.code === 'resource-exhausted' || error.message?.includes('exceeds the maximum')) {
         setErrorMsg("Lỗi: Đề thi có chứa quá nhiều hình ảnh, dung lượng vượt mức cho phép. Vui lòng chia nhỏ đề thi.");
      } else {
         setErrorMsg("Không thể lưu đề thi lên máy chủ do lỗi kết nối.");
      }
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId));
    } catch (error) {
      console.error("Lỗi xóa đề thi:", error);
    }
  };

  // ==========================================
  // XUẤT/NHẬP FILE ĐỀ THI
  // ==========================================
  const handleExportQuizzes = () => {
    const teacherQuizzes = quizzes.filter(q => q.teacherId === user?.uid);
    if (teacherQuizzes.length === 0) {
      alert("Bạn chưa có đề thi nào để xuất ra file!");
      return;
    }
    
    const dataStr = JSON.stringify(teacherQuizzes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_sach_de_thi_Backup_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
  };

  const handleImportQuizzes = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!Array.isArray(importedData)) throw new Error("File không đúng định dạng!");
        
        let successCount = 0;
        for (const quiz of importedData) {
          const quizId = quiz.id || Date.now().toString() + Math.floor(Math.random()*1000);
          const quizRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
          await setDoc(quizRef, {
            ...quiz,
            teacherId: user.uid,
            teacherEmail: user.email || 'Giảng viên import',
            createdAt: Date.now() 
          });
          successCount++;
        }
        alert(`Đã khôi phục thành công ${successCount} đề thi từ file lên hệ thống!`);
      } catch (error) {
        console.error("Lỗi đọc file:", error);
        alert("Lỗi: File không hợp lệ hoặc bị hỏng.");
      }
      event.target.value = null; 
    };
    reader.readAsText(file);
  };

  // ==========================================
  // CHỨC NĂNG CỦA SINH VIÊN
  // ==========================================
  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setStudentAnswers({});
    setIsQuizFinished(false);
    setCurrentView('quiz-taker');
  };

  const handleSelectAnswer = (qId, value, isTextInput = false) => {
    // Nếu là trắc nghiệm, khóa khi đã chọn. Nếu là gõ chữ thì cho phép sửa thoải mái.
    if (!isTextInput && studentAnswers[qId]) return;
    setStudentAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const finishQuiz = async () => {
    setIsQuizFinished(true);
    if (!user || currentRole !== 'student') return;

    const normalQuestions = activeQuiz.questions?.filter(q => !q.isPassageOnly) || [];
    let correctCount = 0;
    normalQuestions.forEach(q => {
      if (q.type === 'fill-blank') {
        const stuAns = studentAnswers[q.id] || '';
        if (stuAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correctCount++;
        }
      } else {
        if (studentAnswers[q.id] === q.correctAnswer) correctCount++;
      }
    });

    try {
      const resultId = `${user.uid}_${activeQuiz.id}_${Date.now()}`;
      const resultRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizResults', resultId);
      await setDoc(resultRef, {
        quizId: activeQuiz.id,
        studentId: user.uid,
        studentEmail: userProfile?.email || user.email || 'Sinh viên',
        score: correctCount,
        total: normalQuestions.length,
        answers: studentAnswers,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Lỗi khi nộp bài lên hệ thống:", error);
    }
  };

  // ==========================================
  // GIAO DIỆN HIỂN THỊ
  // ==========================================
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-blue-600 bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-semibold text-lg">Đang kết nối hệ thống...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz System</h1>
            <p className="text-gray-500">
              {authMode === 'login' ? 'Đăng nhập vào tài khoản của bạn' : 'Đăng ký tài khoản mới'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-200">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="vidu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    required
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors mt-2 shadow-md"
            >
              {authMode === 'login' ? <><LogIn size={20}/> Đăng Nhập</> : <><UserPlus size={20}/> Tạo Tài Khoản</>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            {authMode === 'login' ? (
              <p className="text-gray-600">
                Bạn chưa có tài khoản?{' '}
                <button type="button" onClick={() => {setAuthMode('register'); setAuthError('');}} className="text-blue-600 font-bold hover:underline">
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => {setAuthMode('login'); setAuthError('');}} className="text-blue-600 font-bold hover:underline">
                  Quay lại đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'role-selection') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center">Thiết lập tài khoản</h1>
        <p className="text-gray-600 mb-8">Xin chào <span className="font-bold">{user?.email}</span>. Vui lòng chọn vai trò của bạn.</p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={() => handleSelectRole('teacher')}
            className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all group w-64 flex flex-col items-center"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
              <UserCircle size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Giảng Viên</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Tạo đề thi, soạn câu hỏi và chia sẻ cho sinh viên.</p>
          </button>

          <button 
            onClick={() => handleSelectRole('student')}
            className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 transition-all group w-64 flex flex-col items-center"
          >
            <div className="bg-green-100 p-4 rounded-full mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors text-green-600">
              <GraduationCap size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Sinh Viên</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Xem danh sách vòng thi và làm bài trực tuyến.</p>
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              {currentRole === 'teacher' ? <UserCircle size={40} className="text-blue-600" /> : <GraduationCap size={40} className="text-green-600" />}
              <div>
                <span className="font-bold text-gray-800 block text-lg">
                  {currentRole === 'teacher' ? 'Bảng Điều Khiển Giảng Viên' : 'Trang Thi Sinh Viên'}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail size={14}/> {user?.email}
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-semibold transition"
            >
              Đăng xuất
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Danh sách đề thi</h2>
            {currentRole === 'teacher' && (
              <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                <button 
                  onClick={handleExportQuizzes}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-300 shadow-sm text-sm"
                  title="Tải toàn bộ đề thi của bạn về máy tính"
                >
                  <Download size={16} /> Xuất
                </button>
                
                <label className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-300 shadow-sm cursor-pointer text-sm" title="Khôi phục đề thi từ file .json">
                  <Upload size={16} /> Nhập
                  <input type="file" accept=".json" onChange={handleImportQuizzes} className="hidden" />
                </label>

                <button 
                  onClick={startCreatingQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <PlusCircle size={20} /> Tạo Mới
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.length === 0 ? (
              <div className="col-span-full text-center p-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
                <p>Hệ thống hiện tại chưa có đề thi nào.</p>
                {currentRole === 'teacher' && <p className="text-sm mt-2 text-blue-600">Hãy nhấn "Tạo Mới" để bắt đầu thiết kế bài tập!</p>}
              </div>
            ) : (
              quizzes.map((quiz, idx) => {
                const normalQuestions = quiz.questions?.filter(q => !q.isPassageOnly) || [];
                return (
                  <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between relative group hover:shadow-md transition">
                    {currentRole === 'teacher' && quiz.teacherId === user?.uid && (
                      <button 
                        onClick={() => { if(window.confirm('Bạn có chắc chắn muốn xóa đề thi này khỏi hệ thống?')) handleDeleteQuiz(quiz.id); }}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-full p-1 z-10"
                        title="Xóa đề thi"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <div className="mb-6">
                      <div className="text-xs font-bold text-blue-600 mb-1 tracking-wider uppercase">Vòng thi số {quizzes.length - idx}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 pr-8 line-clamp-2">{quiz.title}</h3>
                      <div className="flex flex-col gap-1 mt-3">
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <BookOpen size={16} /> Bao gồm {normalQuestions.length} câu hỏi
                        </p>
                        {currentRole === 'teacher' && quiz.teacherId === user?.uid && (
                          <p className="text-gray-500 text-sm flex items-center gap-2">
                            <Users size={16} /> Lượt nộp bài: <span className="font-bold text-blue-600">{results.filter(r => r.quizId === quiz.id).length}</span>
                          </p>
                        )}
                        {currentRole === 'student' && quiz.teacherEmail && (
                          <p className="text-gray-400 text-xs flex items-center gap-2">
                            <UserCircle size={14} /> GV: {quiz.teacherEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {currentRole === 'student' ? (
                      <button 
                        onClick={() => startQuiz(quiz)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
                      >
                        <PlayCircle size={20} /> Bắt Đầu Làm Bài
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedQuizForResults(quiz);
                          setCurrentView('quiz-results');
                        }}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-sm border border-blue-200"
                      >
                        <BarChart2 size={20} /> Xem Kết Quả Sinh Viên
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz-creator' && editingQuiz) {
    let questionCounter = 0; // Bộ đếm cho câu hỏi thật sự
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => {
              if (editingQuiz.questions.length > 0 && !window.confirm('Bạn có chắc muốn hủy? Các câu hỏi chưa lưu sẽ bị mất.')) return;
              setCurrentView('dashboard');
            }}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Quay lại danh sách
          </button>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-200 shadow-sm animate-pulse">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Tiêu đề vòng thi / Đề thi</h2>
            <input 
              type="text" 
              placeholder="Ví dụ: Kiểm tra Tiếng Anh - Reading Part 6..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-medium transition"
              value={editingQuiz.title}
              onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
            />
          </div>

          <div className="space-y-6">
            {editingQuiz.questions.map((q, qIndex) => {
              // --- NẾU LÀ KHỐI BÀI ĐỌC (PASSAGE) ---
              if (q.isPassageOnly) {
                return (
                  <div key={q.id} className="bg-blue-50 p-6 rounded-xl shadow-sm border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-blue-800 bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-wider text-sm">
                        <FileText size={18}/> Ngữ cảnh / Bài đọc (Dùng chung cho các câu dưới)
                      </div>
                      <button 
                        onClick={() => {
                          const newQuestions = editingQuiz.questions.filter((_, i) => i !== qIndex);
                          setEditingQuiz({...editingQuiz, questions: newQuestions});
                        }}
                        className="text-gray-400 hover:text-red-500 transition bg-white p-1.5 rounded-md shadow-sm"
                        title="Xóa khối ngữ cảnh này"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="relative mb-2">
                      <textarea 
                        placeholder="Nhập nội dung bài đọc hoặc dán hình ảnh đoạn văn (Ctrl+V) vào đây..."
                        className="w-full p-4 pb-8 border border-blue-300 rounded-lg min-h-[120px] outline-none focus:border-blue-500 transition bg-white"
                        value={q.text}
                        onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                        onPaste={(e) => handlePasteImage(e, qIndex)}
                      />
                      <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-blue-600 transition" title="Chọn ảnh từ máy tính">
                        <ImageIcon size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, qIndex)} />
                      </label>
                    </div>

                    {q.image && (
                      <div className="relative inline-block mt-2 border-2 border-blue-200 rounded-lg p-2 bg-white shadow-sm">
                        <img src={q.image} alt="Ảnh bài đọc" className="max-h-64 object-contain rounded" />
                        <button onClick={() => removeImage(qIndex)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // --- NẾU LÀ CÂU HỎI TRẮC NGHIỆM BÌNH THƯỜNG ---
              questionCounter++;
              return (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded">Câu hỏi số {questionCounter}</div>
                    <button 
                      onClick={() => {
                        const newQuestions = editingQuiz.questions.filter((_, i) => i !== qIndex);
                        setEditingQuiz({...editingQuiz, questions: newQuestions});
                      }}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="relative mb-4">
                    <textarea 
                      placeholder="Nhập câu hỏi (Ví dụ: 27, hoặc dán ảnh vào đây)..."
                      className="w-full p-3 pb-8 border border-gray-300 rounded-lg min-h-[80px] outline-none focus:border-blue-500 transition"
                      value={q.text}
                      onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                      onPaste={(e) => handlePasteImage(e, qIndex)}
                    />
                    <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-blue-600 transition" title="Chọn ảnh từ máy tính">
                      <ImageIcon size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, qIndex)} />
                    </label>
                  </div>

                  {q.image && (
                    <div className="relative inline-block mb-4 border border-gray-200 rounded p-2 bg-gray-50">
                      <img src={q.image} alt="Ảnh câu hỏi" className="max-h-48 object-contain rounded" />
                      <button onClick={() => removeImage(qIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* PHẦN GIAO DIỆN ĐÁP ÁN: Tùy thuộc vào loại câu hỏi */}
                  {q.type === 'fill-blank' ? (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Nhập đáp án đúng (Sinh viên sẽ phải gõ chính xác chữ này để được điểm):</p>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: H, A, hoặc nhập một từ tiếng Anh..."
                        className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none text-lg font-bold text-gray-800"
                        value={q.correctAnswer}
                        onChange={(e) => setCorrectAnswer(qIndex, e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Nhập đáp án và <span className="text-green-600 font-bold underline">tích vào ô vuông đầu dòng</span> để chọn đáp án đúng:</p>
                        {q.options.map((opt, optIndex) => (
                          <div key={opt.id} className={`flex items-start gap-3 p-2 border rounded-lg transition-colors ${q.correctAnswer === opt.id ? 'bg-green-50 border-green-400 shadow-inner' : 'border-gray-200'}`}>
                            <div 
                              onClick={() => setCorrectAnswer(qIndex, opt.id)}
                              className={`mt-1 w-7 h-7 flex-shrink-0 rounded-md flex items-center justify-center cursor-pointer transition-all ${q.correctAnswer === opt.id ? 'bg-green-500 scale-110' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="Click để đánh dấu đây là đáp án đúng"
                            >
                              {q.correctAnswer === opt.id && <CheckCircle2 size={18} className="text-white" />}
                            </div>
                            
                            <span className="font-bold text-gray-600 w-6 text-center mt-1.5">{opt.id}.</span>
                            
                            <div className="flex-grow relative flex flex-col gap-2">
                              <div className="relative w-full">
                                <input 
                                  type="text" 
                                  placeholder={`Nội dung đáp án ${opt.id}...`}
                                  className="w-full p-2 pr-8 bg-transparent outline-none focus:border-b-2 focus:border-blue-500 transition border-b border-transparent"
                                  value={opt.text}
                                  onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                                  onPaste={(e) => handlePasteImage(e, qIndex, optIndex)}
                                />
                                <label className="absolute right-1 top-2.5 cursor-pointer text-gray-400 hover:text-blue-600 transition" title="Chọn ảnh từ máy tính">
                                  <ImageIcon size={18} />
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, qIndex, optIndex)} />
                                </label>
                              </div>
                              {opt.image && (
                                <div className="relative inline-block border border-gray-200 rounded p-1 w-max bg-white shadow-sm">
                                  <img src={opt.image} alt={`Ảnh đáp án ${opt.id}`} className="max-h-24 object-contain rounded" />
                                  <button onClick={() => removeImage(qIndex, optIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow">
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Nút thêm bớt đáp án động */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                         <button onClick={() => addOption(qIndex)} className="text-sm text-blue-600 font-semibold hover:text-blue-800 transition">+ Thêm đáp án ({String.fromCharCode(65 + q.options.length)})</button>
                         {q.options.length > 2 && (
                           <button onClick={() => removeOption(qIndex)} className="text-sm text-red-500 font-semibold hover:text-red-700 transition">- Bớt đáp án cuối</button>
                         )}
                      </div>
                    </>
                  )}

                  {q.correctAnswer === '' && (
                    <p className="text-red-500 text-sm mt-3 flex items-center"><AlertCircle size={14} className="mr-1"/> Vui lòng chọn/điền đáp án đúng cho câu hỏi này</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 flex-wrap">
            <button 
              onClick={addPassageToQuiz}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 py-3 px-4 rounded-xl font-bold flex-1 border border-blue-200 flex items-center justify-center gap-2 transition min-w-[150px]"
            >
              <FileText size={20} /> Chèn Bài Đọc
            </button>
            <button 
              onClick={addQuestionToQuiz}
              className="bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-bold flex-1 border border-dashed border-gray-400 flex items-center justify-center gap-2 transition min-w-[180px]"
            >
              <PlusCircle size={20} /> Câu Trắc Nghiệm
            </button>
            <button 
              onClick={addFillBlankQuestion}
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 py-3 px-4 rounded-xl font-bold flex-1 border border-dashed border-yellow-400 flex items-center justify-center gap-2 transition min-w-[180px]"
            >
              <PlusCircle size={20} /> Câu Điền Chữ
            </button>
            <button 
              onClick={saveQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-bold w-full sm:w-auto shadow-md flex items-center justify-center gap-2 transition"
            >
              <Save size={20} /> Lưu Đề Thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz-taker' && activeQuiz) {
    const normalQuestions = activeQuiz.questions?.filter(q => !q.isPassageOnly) || [];
    const totalQ = normalQuestions.length;
    const answeredCount = Object.keys(studentAnswers).length;
    
    let correctCount = 0;
    if (isQuizFinished) {
      normalQuestions.forEach(q => {
        if (q.type === 'fill-blank') {
          const stuAns = studentAnswers[q.id] || '';
          if (stuAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            correctCount++;
          }
        } else {
          if (studentAnswers[q.id] === q.correctAnswer) correctCount++;
        }
      });
    }

    let questionCounter = 0; // Để sinh viên xem đúng số thứ tự

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sticky top-4 z-10 border-t-4 border-green-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{activeQuiz.title}</h2>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(answeredCount / (totalQ || 1)) * 100}%` }}></div>
              </div>
              <p className="text-gray-500 text-xs font-medium">Tiến độ: Đã trả lời {answeredCount}/{totalQ} câu</p>
            </div>
            {!isQuizFinished ? (
               <button 
                onClick={finishQuiz}
                disabled={answeredCount < totalQ}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold transition-all ${answeredCount === totalQ && totalQ > 0 ? 'bg-green-600 text-white shadow-md hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Nộp Bài
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition"
              >
                <ArrowLeft size={18}/> Về Trang Chủ
              </button>
            )}
          </div>

          {isQuizFinished && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-8 text-center animate-fade-in-up">
              <h3 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">Chúc mừng bạn đã hoàn thành bài thi!</h3>
              <p className="text-lg text-green-800">
                Điểm số của bạn: <span className="text-4xl font-black text-green-600 mx-2">{correctCount}/{totalQ}</span> câu đúng.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {activeQuiz.questions?.map((q, index) => {
              if (q.isPassageOnly) {
                return (
                  <div key={q.id} className="bg-blue-50 rounded-xl shadow-sm border-l-4 border-blue-500 p-5 sm:p-8 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold uppercase tracking-wider text-sm">
                      <FileText size={18}/> Ngữ cảnh / Bài đọc
                    </div>
                    {q.text && <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">{q.text}</p>}
                    {q.image && <img src={q.image} alt="Bài đọc" className="mt-4 w-full rounded-lg shadow-sm border border-blue-200 object-contain bg-white" />}
                  </div>
                );
              }

              questionCounter++;
              const selectedAns = studentAnswers[q.id];
              // Đối với câu trắc nghiệm, nếu đã ấn chọn thì là đã trả lời. Đối với điền từ thì không giới hạn cho đến khi Nộp bài.
              const isAnswered = q.type === 'fill-blank' ? isQuizFinished : !!selectedAns;
              
              let isCorrect = false;
              if (q.type === 'fill-blank') {
                isCorrect = selectedAns?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              } else {
                isCorrect = selectedAns === q.correctAnswer;
              }

              return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800 text-lg leading-relaxed">
                        <span className="text-green-600 mr-2">Câu {questionCounter}:</span>
                        {q.text}
                      </h3>
                      {q.image && (
                        <img src={q.image} alt="Ảnh câu hỏi" className="mt-4 max-h-72 rounded-lg shadow-sm border border-gray-200 object-contain bg-gray-50" />
                      )}
                    </div>
                    
                    {isQuizFinished && (
                       <span className={`flex-shrink-0 flex items-center text-sm font-bold px-3 py-1 rounded-full ${!selectedAns || selectedAns.trim() === '' ? 'bg-gray-100 text-gray-500' : isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {!selectedAns || selectedAns.trim() === '' ? 'Bỏ trống' : isCorrect ? <><CheckCircle2 size={16} className="mr-1"/> Chính xác</> : <><XCircle size={16} className="mr-1"/> Sai</>}
                       </span>
                    )}
                  </div>

                  <div className="space-y-3 mt-4">
                    {q.type === 'fill-blank' ? (
                      <div className="mt-2">
                        <input 
                          type="text" 
                          disabled={isQuizFinished}
                          placeholder="Gõ đáp án của bạn vào đây..."
                          className={`w-full p-4 text-lg border-2 rounded-xl outline-none transition font-bold ${isQuizFinished ? (isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900') : 'border-gray-300 focus:border-blue-500 text-gray-800'}`}
                          value={selectedAns || ''}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value, true)}
                        />
                        {isQuizFinished && !isCorrect && (
                          <div className="mt-3 p-3 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm flex items-center gap-2">
                            <span className="font-bold">Đáp án đúng là:</span> <span className="text-lg font-black">{q.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      q.options.map(opt => {
                        let btnStyle = "border-gray-200 hover:bg-gray-50 hover:border-gray-300";
                        let icon = null;

                        if (isQuizFinished || selectedAns) {
                          if (opt.id === q.correctAnswer && isQuizFinished) {
                            btnStyle = "border-green-500 bg-green-50 text-green-900 ring-2 ring-green-500 shadow-sm";
                            icon = <CheckCircle2 className="text-green-600 flex-shrink-0" size={22} />;
                          } else if (opt.id === selectedAns) {
                            if (!isQuizFinished) {
                               btnStyle = "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500";
                            } else if (!isCorrect) {
                               btnStyle = "border-red-500 bg-red-50 text-red-900 opacity-90";
                               icon = <XCircle className="text-red-500 flex-shrink-0" size={22} />;
                            }
                          } else {
                            btnStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={opt.id}
                            disabled={isAnswered || isQuizFinished}
                            onClick={() => handleSelectAnswer(q.id, opt.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 flex justify-between items-center transition-all duration-200 ${!isQuizFinished && !isAnswered ? 'cursor-pointer hover:shadow-sm transform hover:-translate-y-0.5' : 'cursor-default'} ${btnStyle}`}
                          >
                            <div className="flex flex-col flex-grow pr-4">
                              <div className="flex items-start">
                                <span className="font-bold w-8 flex-shrink-0 mt-0.5">{opt.id}.</span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>
                              {opt.image && (
                                <img src={opt.image} alt={`Ảnh đáp án ${opt.id}`} className="mt-3 ml-8 max-h-32 rounded border border-gray-200 object-contain self-start bg-white shadow-sm" />
                              )}
                            </div>
                            {icon}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz-results' && selectedQuizForResults) {
    const quizResults = results.filter(r => r.quizId === selectedQuizForResults.id);

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Quay lại danh sách đề
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-t-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thống kê: {selectedQuizForResults.title}</h2>
            <div className="flex gap-4 text-gray-600">
              <span className="flex items-center gap-1"><Users size={18}/> {quizResults.length} lượt nộp bài</span>
              <span className="flex items-center gap-1"><BookOpen size={18}/> {(selectedQuizForResults.questions?.filter(q => !q.isPassageOnly) || []).length} câu hỏi</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {quizResults.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <BarChart2 size={48} className="mx-auto text-gray-300 mb-3"/>
                <p>Chưa có sinh viên nào làm bài thi này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <th className="p-4 font-bold">Email Sinh Viên</th>
                      <th className="p-4 font-bold">Điểm Số</th>
                      <th className="p-4 font-bold">Thời Gian Nộp</th>
                      <th className="p-4 font-bold text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizResults.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-800">{r.studentEmail}</td>
                        <td className="p-4">
                          <span className={`font-bold px-2 py-1 rounded ${r.score >= (r.total / 2) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {r.score} / {r.total}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14}/> {new Date(r.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedStudentResult(r);
                              setCurrentView('student-result-detail');
                            }}
                            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center justify-end gap-1 ml-auto font-medium transition"
                          >
                            <Eye size={16}/> Xem bài làm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'student-result-detail' && selectedStudentResult && selectedQuizForResults) {
    const studentAns = selectedStudentResult.answers || {};
    let questionCounter = 0;
    
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setCurrentView('quiz-results')}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Quay lại danh sách kết quả
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-t-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Chi tiết bài làm: {selectedQuizForResults.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Sinh viên</p>
                <p className="font-bold flex items-center gap-2"><UserCircle size={18} className="text-blue-500"/> {selectedStudentResult.studentEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Điểm số</p>
                <p className={`font-bold text-lg ${selectedStudentResult.score >= (selectedStudentResult.total / 2) ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStudentResult.score} / {selectedStudentResult.total}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedQuizForResults.questions?.map((q, index) => {
              if (q.isPassageOnly) {
                 return (
                   <div key={q.id} className="bg-blue-50 rounded-xl shadow-sm border-l-4 border-blue-500 p-5 mb-2">
                      <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold uppercase tracking-wider text-sm">
                         <FileText size={18}/> Ngữ cảnh / Bài đọc
                      </div>
                      {q.text && <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{q.text}</p>}
                      {q.image && <img src={q.image} alt="Bài đọc" className="mt-3 max-h-64 rounded-lg shadow-sm border border-blue-200 object-contain bg-white" />}
                   </div>
                 );
              }

              questionCounter++;
              const selectedByStudent = studentAns[q.id] || '';
              
              let isCorrect = false;
              if (q.type === 'fill-blank') {
                isCorrect = selectedByStudent.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              } else {
                isCorrect = selectedByStudent === q.correctAnswer;
              }
              const isUnanswered = !selectedByStudent || selectedByStudent.trim() === '';

              return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800 text-lg leading-relaxed">
                        <span className="text-blue-600 mr-2">Câu {questionCounter}:</span>
                        {q.text}
                      </h3>
                      {q.image && (
                        <img src={q.image} alt="Ảnh câu hỏi" className="mt-4 max-h-72 rounded-lg shadow-sm border border-gray-200 object-contain bg-gray-50" />
                      )}
                    </div>
                    
                    <span className={`flex-shrink-0 flex items-center text-sm font-bold px-3 py-1 rounded-full ${isUnanswered ? 'bg-gray-100 text-gray-500' : isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isUnanswered ? 'Bỏ trống' : isCorrect ? <><CheckCircle2 size={16} className="mr-1"/> Đúng</> : <><XCircle size={16} className="mr-1"/> Sai</>}
                    </span>
                  </div>

                  {q.type === 'fill-blank' ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Sinh viên đã gõ:</p>
                        <p className={`text-lg font-bold ${isUnanswered ? 'text-gray-400' : isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                           {isUnanswered ? '(Không làm)' : selectedByStudent}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600 font-semibold mb-1">Đáp án của bạn:</p>
                        <p className="text-lg font-bold text-green-800 uppercase">{q.correctAnswer}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {q.options.map(opt => {
                        let btnStyle = "border-gray-200 bg-white";
                        let icon = null;

                        if (opt.id === q.correctAnswer) {
                          btnStyle = "border-green-400 bg-green-50 ring-1 ring-green-400";
                          icon = <CheckCircle2 className="text-green-600 flex-shrink-0" size={22} />;
                        } else if (opt.id === selectedByStudent && !isCorrect) {
                          btnStyle = "border-red-400 bg-red-50 opacity-90";
                          icon = <XCircle className="text-red-500 flex-shrink-0" size={22} />;
                        } else {
                          btnStyle = "border-gray-100 bg-gray-50 opacity-50";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`w-full text-left p-4 rounded-xl border-2 flex justify-between items-center ${btnStyle}`}
                          >
                            <div className="flex flex-col flex-grow pr-4 text-gray-700">
                              <div className="flex items-start">
                                <span className="font-bold w-8 flex-shrink-0 mt-0.5">{opt.id}.</span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>
                              {opt.image && (
                                <img src={opt.image} alt={`Ảnh đáp án ${opt.id}`} className="mt-3 ml-8 max-h-32 rounded border border-gray-200 object-contain self-start bg-white shadow-sm" />
                              )}
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
>>>>>>> 968da74e270cfa9d60df3f3e251ae9299d4b14e0
}