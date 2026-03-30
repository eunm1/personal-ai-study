// src/types/post-events.types.ts (새로 만들거나 기존 파일에 추가)

export interface PostCompletedEvent {
  postId: string;
  tempUserId: string;
  status: 'COMPLETED' | 'FAILED'; // 상태도 명확하게!
  percent?: string; 
  imageUrl?: string; // 성공 시에만 존재하므로 선택적 필드
  title?: string;    // 토스트 알림에 보여주면 좋음
}