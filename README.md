

## post 등록 및 ai 분석 프로그램 (개인 공부용)

**Nest Architecture**는 
이정환 강사님의 강의자료 참고하여 변형하였습니다

참고 출처 https://github.com/onebite-nextjs/challenge__onebite-cinema-server

개발 과정 : https://hulking-chipmunk-bc1.notion.site/post-ai-analysis-project-3273588db9bd80b29429df43c35cd33e?pvs=73

### 1. ai 연동전 전체 테이블 구조 수정 ( 2026.03.17 )<br>
- (1) schema.prisma 수정 (수정 이후 npx prisma generate 실행)
- (2) src/[테이블명]/dto 수정
- (3) src/[테이블명]/entity 수정
- (4) src/[테이블명] service, controller, module 순으로 수정

### 2. ai 연동
- (1) npm install @google/generative-ai
- (2) Google AI Studio 에서 Get API key -> 프로젝트 생성 -> API 복사 -> .env에 적용
https://aistudio.google.com/prompts/new_chat
- (3) npx nest g mo ai  # ai > AiModule 생성
- (4) npx nest g s ai --no-spec  # ai > AiService 생성 (테스트 파일 없이)

```
## npx nest g mo ai 명령어 하나씩 뜯어보기
- nest: NestJS 전용 도구(CLI)를 사용하겠다는 뜻입니다.
- g (generate): "생성하겠다"는 의미입니다.
- res (resource): 단순히 파일 하나가 아니라, **CRUD(생성, 조회, 수정, 삭제)**에 필요한 묶음을 통째로 만들겠다는 뜻입니다.
- 이걸 치면 ai.controller.ts, ai.service.ts, ai.module.ts, dto, entities 폴더까지 한 번에 생깁니다.
- ai: 새로 만들 기능의 이름입니다. (폴더 이름이 ai가 됩니다.)
- --no-spec: "테스트 파일(.spec.ts)은 만들지 마!"라는 옵션입니다.
- 보통 학습용이나 빠른 프로토타이핑을 할 때 파일이 너무 많아지면 어지러우니까 이 옵션을 자주 씁니다.`
```

- (5) post 모듈에 ai 모듈 임포트
- (6) post service에서 create단계에 ai service 기능 추가

- (7) 이미지 생성은 비동기 백그라운드 방식으로 적용<br>
"백그라운드 처리(Queue)" 방식 - image-genration 폴더, module, service 생성


```
**  bullmodule 설치해서 queue 이용하기
- npm install bullmq
- npm install @nestjs/bullmq bullmq

** supabase storage 이용하기 new bucket 생성
- npm install @supabase/supabase-js
** supabase-storage.service.ts 생성 : 이미지 정보 저장
```


```
- BullMQ를 쓰려면 무조건 필요한 것: REDIS 
① BullMQ (일 시키는 반장님)
NestJS 서버가 너무 바쁘지 않게 도와주는 **"작업 관리자"**입니다.
하는 일: "이미지 생성"처럼 오래 걸리는 일을 받으면, "알았어, 나중에 처리할게!" 하고 유저를 먼저 보내줍니다. 그리고 뒷단에서 조용히 일을 처리하죠.
장점: 서버가 중간에 멈춰도 작업이 사라지지 않고, 실패하면 다시 시도(Retry)하는 기능도 있습니다.

② Redis (작업이 담긴 택배 상자 더미)
BullMQ 반장님이 일거리를 기록해두는 **"메모리 메모장/창고"**입니다.
하는 일: "1번 게시글 이미지 생성해야 함"이라는 정보를 자기 메모리에 적어둡니다.
특징: 일반 DB(MySQL 등)보다 속도가 압도적으로 빠릅니다. 그래서 실시간으로 작업이 쌓이고 빠지는 '큐(Queue)' 역할에 딱 맞습니다.

③ Docker: "내 컴퓨터 안에 만드는 가상 컨테이너"
도커는 한마디로 **"환경 통째로 박스에 담기"**입니다.
하는 일: Redis 같은 프로그램을 내 컴퓨터에 직접 설치(Install)하지 않고, **'이미지'**라는 설계도를 내려받아 **'컨테이너'**라는 독립된 공간에서 실행합니다.
특징:
고립성: 내 컴퓨터의 다른 설정과 꼬이지 않아요. (지울 때도 컨테이너만 삭제하면 끝!)
동일성: 내 컴퓨터에서 돌던 도커 설정 그대로 서버(AWS 등)에 옮기면 똑같이 돌아갑니다.
버전 관리: Redis 6 버전, 7 버전을 동시에 띄워서 테스트할 수도 있습니다.
```

**vercel에 올릴때에는 Docker대신 Upstach 사용해야함**

- (8) post service에 post-tasks 라는 이름의 큐 담기 (post.processor.ts 생성)

- (9) npm install @nestjs/config : <br>
process.env.GEMINI_API_KEY; => this.configService.get<string>('SUPABASE_URL'), // 👈 안전하게 가져오기

- (10) docker 설치 - .env, app.module.ts 수정

```
* 켜기 
(방법1)
terminal: docker run -d -p 6379:6379 --name my-redis redis
(방법2 )
Docker Desktop 아이콘 클릭 (실행)
terminal: docker start my-redis

명령어 뜯어보기
- docker run: "컨테이너 하나 실행해 줘!"
-d: "백그라운드에서 조용히 실행해 줘 (데몬 모드)."
-p 6379:6379: "내 컴퓨터의 6379번 문과 컨테이너의 6379번 문을 연결해 줘."
--name my-redis: "이 컨테이너 이름을 'my-redis'라고 부를게."
- redis: "Redis라는 이름의 이미지를 가져와서 실행해 줘."

* 동작 확인 : docker ps

* 끄기 
(방법1) 
taskkill /IM "Docker Desktop.exe" /F
(방법2)
docker stop my-redis (Redis만 종료)
Docker Desktop 작업표시줄 아이콘에서 실행 중지
```


- (11) 이미지는 **supabse storage**에 저장 후 url db 저장<br>
이미지 ai 는 Leonardo.ai 사용 : https://app.leonardo.ai/api-access<br>
(제미나이 gemini-3.1-flash-image-preview : [429 Too Many Requests] error )


## 3. DB 스키마 수정 및 마이그레이션

- (1) Prisma 스키마 분리 및 마이그레이션
```
- Post 테이블에서 AI 관련 필드를 빼고, 별도의 PostAnalysis 테이블 생성 (1:1 관계).
- PostStatus 이넘(Enum) 추가 및 tempImageUrl 필드 생성.
- schema.prisma 파일의 Post 모델에 password와 author 필드를 추가합니다.
- npx prisma migrate dev --name split_post_and_analysis
* 주의: 기존 데이터가 있다면 필수가 된 `author`와 `password` 값이 없어서 에러가 날 수 있습니다. 로컬이라면 `migrate reset`이 편하지만, 데이터가 중요하다면 기본값을 임시로 주어야 합니다.

*** ⚠️ 마이그레이션 오류 방지 전략 (2가지 방법)
방법 1: 기존 데이터를 초기화
- 명령어: npx prisma migrate dev 실행 시 "데이터가 유실될 수 있습니다. 계속하시겠습니까?"라는 메시지가 뜨면 y를 누르세요.

- 결과: 기존의 테스트 데이터는 지워지지만, author, password가 필수인 새로운 테이블 구조가 완벽하게 잡힙니다.

방법 2: 데이터를 유지
1. 스키마에서 잠시 author String @default("Unknown"), password String @default("tmp1234")로 설정합니다.

2. 마이그레이션을 실행합니다. (기존 데이터들에 "Unknown"이 채워지며 성공합니다.)

3. 다시 스키마에서 @default 부분을 지우고 한 번 더 마이그레이션합니다.
---------------------------------------------------------------
🚀 데이터 유실 없이 테이블을 분리하는 3단계 전략
나중에 실무에서 테이블을 쪼개야 한다면, 아래 순서대로 진행하면 리셋 없이 안전하게 옮길 수 있습니다.

1. 1단계: "허용(Optional)" 상태로 테이블 생성
처음부터 PostAnalysis를 필수(postId Int @unique)로 만들지 말고, 일단 선택 사항으로 만듭니다.

PostAnalysis를 만들되, Post와의 관계를 analysis PostAnalysis? (선택적)로 둡니다.

이렇게 하면 기존 Post 데이터들이 PostAnalysis가 없어도 에러가 나지 않습니다.

npx prisma db push

2. 2단계: 데이터 이관(Data Migration) 스크립트 실행
구조만 만들어둔 상태에서, 기존 Post에 있던 데이터를 PostAnalysis로 복사해주는 작업이 필요합니다.

SQL 문법 사용: 
INSERT INTO "PostAnalysis" ("postId", "summary", ...) 
SELECT "id", "summary", ... 
FROM "Post"; 
같은 쿼리를 실행합니다.

또는 NestJS 서비스에서 임시 로직을 짜서 데이터를 한 번 쫙 옮겨줍니다.

3. 3단계: 제약 조건 강화 (Finalize)
데이터가 다 옮겨진 것을 확인했다면, 이제 비로소 스키마를 **필수(Required)**로 바꿉니다.

@unique 제약 조건을 걸고, 필요 없는 Post 테이블의 컬럼들을 삭제합니다.

이때는 이미 데이터가 다 들어가 있기 때문에 Prisma가 리셋 없이 마이그레이션을 통과시켜 줍니다.

🛠️ 노션(Notion)에 적어둘 "미래를 위한 팁"
💡 데이터 이관(Data Migration) 원칙

Soft Change: 먼저 새로운 구조를 '선택 사항'으로 추가한다.

Move Data: 스크립트나 SQL로 데이터를 옮긴다.

Hard Change: 데이터가 채워진 후 '필수 제약 조건'을 건다.

Cleanup: 이전 테이블의 중복 컬럼을 지운다.


```

- (2)  npx prisma db push를 실행하여 Supabase DB에 반영합니다. (이미 데이터가 있다면 기본값(Default)을 설정하거나 필드를 선택적(?)으로 만드시는 게 안전합니다.)

- (3)  npx prisma generate로 클라이언트 코드를 새로 고칩니다.

--------------------------------------------------------------------

## .env 환경 세팅

### [Supabase 설정]
DATABASE_URL= [supabase에 프로젝트 생성후 값 가져오기 + 비번 작성]

DIRECT_URL= [supabase에 프로젝트 생성후 값 가져오기 + 비번 작성]

SUPABASE_URL=[설정 값]

SUPABASE_KEY=[secret key 적용]

### [AI 설정]
GEMINI_API_KEY=[google ai studio project 생성 후 비번 작성]

### [Redis 설정 ]
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

--------------------------------------------------------------------

## 실행 순서

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

**docker 실행 후 redis 실행한 뒤 start 해야함**
