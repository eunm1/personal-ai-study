

post 등록 및 ai 분석 프로그램
(개인 공부용)

nest architecture는 
이정환 강사님의 강의자료 참고하여 변형하였습니다
참고 출처 https://github.com/onebite-nextjs/challenge__onebite-cinema-server

1. ai 연동전 전체 테이블 구조 수정 ( 2026.03.17 )
1-1. schema.prisma 수정 (수정 이후 npx prisma generate 실행)
1-2. src/[테이블명]/dto 수정
1-3. src/[테이블명]/entity 수정
1-3. src/[테이블명] service, controller, module 순으로 수정

2. ai 연동
2-1. npm install @google/generative-ai
2-2. Google AI Studio 에서 Get API key -> 프로젝트 생성 -> API 복사 -> .env에 적용
https://aistudio.google.com/prompts/new_chat
2-3. npx nest g mo ai  # AiModule 생성
2-4. npx nest g s ai --no-spec  # AiService 생성 (테스트 파일 없이)
명령어 하나씩 뜯어보기
- nest: NestJS 전용 도구(CLI)를 사용하겠다는 뜻입니다.

- g (generate): "생성하겠다"는 의미입니다.

- res (resource): 단순히 파일 하나가 아니라, **CRUD(생성, 조회, 수정, 삭제)**에 필요한 묶음을 통째로 만들겠다는 뜻입니다.

- 이걸 치면 ai.controller.ts, ai.service.ts, ai.module.ts, dto, entities 폴더까지 한 번에 생깁니다.

- ai: 새로 만들 기능의 이름입니다. (폴더 이름이 ai가 됩니다.)

- --no-spec: "테스트 파일(.spec.ts)은 만들지 마!"라는 옵션입니다.

- 보통 학습용이나 빠른 프로토타이핑을 할 때 파일이 너무 많아지면 어지러우니까 이 옵션을 자주 씁니다.

2-5. post 모듈에 ai 모듈 임포트
2-6. post service에서 create단계에 ai service 기능 추가

2-7 이미지 생성은 비동기 백그라운드 방식으로 적용
"백그라운드 처리(Queue)" 방식

3. DB 스키마 수정
3-1. schema.prisma 파일의 Post 모델에 password와 author 필드를 추가합니다.

3-2. npx prisma db push를 실행하여 Supabase DB에 반영합니다. (이미 데이터가 있다면 기본값(Default)을 설정하거나 필드를 선택적(?)으로 만드시는 게 안전합니다.)

3-3. npx prisma generate로 클라이언트 코드를 새로 고침합니다.

--------------------------------------------------------------------

.env 환경 세팅

# Connect to Supabase via connection pooling
DATABASE_URL= [supabase에 프로젝트 생성후 값 가져오기 + 비번 작성]

# Direct connection to the database. Used for migrations
DIRECT_URL= [supabase에 프로젝트 생성후 값 가져오기 + 비번 작성]

GEMINI_API_KEY=[google ai studio project 생성 후 비번 작성]

--------------------------------------------------------------------

실행 순서

1) git 다운로드

2) npm init

3) Supabse .env에 디비 경로 설정

4) npx prisma generate

5) npx prisma db push

6) npm run build

7) npm run start

8) 접속 http://localhost:12346/

9) 접속 http://localhost:12346/api
=> api 실행 테스트

10) 다른 터미널 실행 npx prisma studio 접속 http://localhost:5555
=> db 상태 확인
