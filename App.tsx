import React, { useState, useEffect } from 'react';
import CampusMap from './components/CampusMap';
import Sidebar from './components/Sidebar';
import SosRequestForm from './components/SosRequestForm';
import ChatBox from './components/ChatBox';
import RewardsHub from './components/RewardsHub';
import SecurityHub from './components/SecurityHub';
import { SosRequest, ChatMessage, UserProfile } from './types';
import { db } from './lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { AlertTriangle, ShieldAlert, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// For now, using mock data for initial UI check until Firebase is confirmed
const MOCK_USER: UserProfile = {
  userId: "user123",
  displayName: "김학우",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Campus",
  points: 1250
};

const INITIAL_MOCK_REQUESTS: SosRequest[] = [
  {
    id: "req1",
    studentId: "user456",
    studentName: "이학우",
    buildingName: "본관 (A동)",
    location: { lat: 37.5518, lng: 126.9255 },
    message: "A동 3층 로비에서 보조배터리 5분만 빌려주실 분 찾습니다!",
    points: 100,
    status: 'WAITING',
    createdAt: new Date()
  },
  {
    id: "req2",
    studentId: "user789",
    studentName: "박학우",
    buildingName: "중앙도서관 (F동)",
    location: { lat: 37.5510, lng: 126.9250 },
    message: "4층 열람실인데 배가 너무 고파서... 밑에서 삼각김밥 하나만 사다주세요 ㅠㅠ",
    points: 200,
    status: 'ACCEPTED',
    helperId: "user123",
    helperName: "김학우",
    createdAt: new Date()
  }
];

const INITIAL_MOCK_CHATS: Record<string, ChatMessage[]> = {
  "req2": [
    {
      id: "msg1",
      requestId: "req2",
      senderId: "user789",
      senderName: "박학우",
      text: "참치마요 삼각김밥으로 부탁드려요!",
      createdAt: new Date()
    }
  ]
};

export default function App() {
  const [requests, setRequests] = useState<SosRequest[]>(INITIAL_MOCK_REQUESTS);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(INITIAL_MOCK_CHATS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USER);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateRequest = (buildingName: string, message: string, points: number, location: { lat: number; lng: number }) => {
    if (currentUser.points < points) {
      triggerToast("보유 포인트가 부족합니다!");
      return;
    }

    const newRequest: SosRequest = {
      id: `req_${Date.now()}`,
      studentId: currentUser.userId,
      studentName: currentUser.displayName,
      buildingName,
      location,
      message,
      points,
      status: 'WAITING',
      createdAt: new Date()
    };

    setRequests(prev => [newRequest, ...prev]);
    setCurrentUser(prev => ({ ...prev, points: prev.points - points }));
    setIsFormOpen(false);
    triggerToast("도움 요청 SOS가 성공적으로 게시되었습니다!");
  };

  const handleAcceptRequest = (request: SosRequest) => {
    setRequests(prev => prev.map(r => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'ACCEPTED',
          helperId: currentUser.userId,
          helperName: currentUser.displayName
        };
      }
      return r;
    }));
    triggerToast(`${request.studentName}님의 도움 요청을 수락했습니다!`);
  };

  const handleCompleteRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'COMPLETED' };
      }
      return r;
    }));

    if (request.helperId === currentUser.userId) {
      setCurrentUser(prev => ({ ...prev, points: prev.points + request.points }));
    }
    triggerToast("도움이 완료되어 포인트 보상이 지급되었습니다!");
  };

  const handleSendMessage = (text: string) => {
    if (!selectedRequestId) return;
    
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      requestId: selectedRequestId,
      senderId: currentUser.userId,
      senderName: currentUser.displayName,
      text,
      createdAt: new Date()
    };

    setChats(prev => ({
      ...prev,
      [selectedRequestId]: [...(prev[selectedRequestId] || []), newMsg]
    }));
  };

  const handleSelectRequest = (request: SosRequest) => {
    setSelectedRequestId(selectedRequestId === request.id ? null : request.id);
  };

  const handleRedeemReward = (points: number, name: string) => {
    if (currentUser.points < points) {
      triggerToast("보유 포인트가 부족합니다!");
      return;
    }
    setCurrentUser(prev => ({ ...prev, points: prev.points - points }));
    triggerToast(`[${name}] 혜택으로 교환되었습니다!`);
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-800 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <Sidebar 
        requests={requests}
        selectedRequestId={selectedRequestId}
        onSelectRequest={handleSelectRequest}
        onOpenForm={() => setIsFormOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        user={currentUser}
      />

      {/* Main Map Content */}
      <div className="flex-1 relative">
        <CampusMap 
          requests={requests}
          onSelectRequest={handleSelectRequest}
          onAcceptRequest={handleAcceptRequest}
          selectedRequestId={selectedRequestId}
          currentUserId={currentUser.userId}
        />

        {/* Right Chat Overlay */}
        <AnimatePresence>
          {selectedRequest && selectedRequest.status === 'ACCEPTED' && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-100 shadow-2xl z-20 flex flex-col"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs">도움 대화방</h3>
                  <p className="text-[10px] text-slate-400">{selectedRequest.studentName} &middot; {selectedRequest.buildingName}</p>
                </div>
                <button 
                  onClick={() => setSelectedRequestId(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ChatBox 
                messages={chats[selectedRequestId || ''] || []}
                onSendMessage={handleSendMessage}
                currentUserId={currentUser.userId}
              />
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => handleCompleteRequest(selectedRequest.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md"
                >
                  도움 완료 및 보상금 전송
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal overlays */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <SosRequestForm 
              onSubmit={handleCreateRequest}
              onClose={() => setIsFormOpen(false)}
              userPoints={currentUser.points}
            />
          </div>
        )}

        {isSecurityOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <SecurityHub 
              onClose={() => setIsSecurityOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}