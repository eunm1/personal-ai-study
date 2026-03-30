// src/notification/notification.controller.ts
import { Controller, Sse, Param, MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Observable, Subject, filter, map } from 'rxjs';
import { PostCompletedEvent } from 'src/types/post-event.types';

@Controller('notifications')
export class NotificationController {
  private readonly postEvents$ = new Subject<PostCompletedEvent>();

  @OnEvent('post.status')
  handlePostCompleted(payload: PostCompletedEvent) {
    console.log("📢 [EventEmitter] -> [SSE Subject] 데이터 전달:", payload);
    this.postEvents$.next(payload); 
  }

//   @Sse('sse/:postId')
//   sse(@Param('postId') postId: string): Observable<MessageEvent> {
//         return this.postEvents$.pipe(
//             // 💡 여기서 '접속한 postId'와 '이벤트가 터진 postId'가 같을 때만 데이터를 흘려보냅니다.
//             filter((data) => data.postId === postId), // 내 글 번호만 필터링!
//             map((data) => ({ data: { status: data.status } } as MessageEvent))
//         );
//     }

    // "글 등록한 사용자"에게만 보내는 더 정교한 방법
    // postId 대신 **userId**나 tempToken(로그인이 없다면 세션 ID 등)을 기준으로 필터링해야 합니다.
    @Sse('sse/:tempUserId') // 💡 postId 대신 tempUserId를 경로로 받음
    sse(@Param('tempUserId') tempUserId: string): Observable<MessageEvent> {
        console.log("postEvetPipe 실행:", tempUserId)
    return this.postEvents$.pipe(
        // 💡 방송국(postEvents$)에서 흘러나오는 데이터 중 
        // 💡 이벤트에 담긴 tempUserId가 지금 접속한 녀석과 같은지 확인!
        filter((data) => data.tempUserId === tempUserId), 
        map((data) => ({ 
        data: { 
            imageUrl: data.imageUrl,
            status: data.status, 
            percent: data.percent, 
            postId: data.postId, // 💡 클라이언트가 이동할 때 쓰라고 postId도 같이 보내줌
            title: data.title    // 💡 토스트에 띄울 제목도 같이 보내주면 굿!
        } 
        } as MessageEvent))
    );
    }
}

// 💡 상태별로 퍼센트를 임의로 정해줄 수 있어요! 👿
//   const percentMap: Record<string, number> = {
//     'ANALYZING': 30,
//     'GENERATING': 70,
//     'UPLOADING': 90,
//     'COMPLETED': 100
//   };