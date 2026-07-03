# Plan code Backend (NestJS) — tái sử dụng từ `edusoft-lms-api`

Nguyên tắc: **kéo hạ tầng dùng chung + pattern CRUD** từ reference về, chỉ viết mới phần domain. Light JWT, single DB (không tenant/Redis/Bull/Throttler).

## Cấu trúc đích
```
backend/src/
├── main.ts                       # bootstrap (adapt từ reference: ValidationPipe, filter, CORS, prefix 'api', Swagger)
├── app.module.ts                 # Config + Mongoose + Database + Global + các feature module
├── enums/  schemas/  database/   # ĐÃ CÓ (28 collection, đã gom folder)
├── common/                       # ★ COPY/ADAPT từ reference
│   ├── filters/all-exceptions.filter.ts      ← filters/catch-everything.filter.ts
│   ├── decorators/roles.decorator.ts         ← decorators/roles.decorator.ts (@Roles)
│   ├── decorators/current-user.decorator.ts  ← MỚI (lấy user từ req)
│   ├── decorators/public.decorator.ts        ← MỚI (@Public bỏ qua auth)
│   ├── guards/jwt-auth.guard.ts              ← adapt roles.guard.ts (verify token thật)
│   ├── guards/roles.guard.ts                 ← guards/roles.guard.ts (check role)
│   ├── types/pagination.type.ts              ← types/index.ts (Pagination<T>, PaginationMetaDto)
│   ├── dtos/pagination-query.dto.ts          ← list-*.dto.ts (keyword/page/pageSize)
│   └── utils/index.ts                        ← utils/index.ts (getPagination, buildPagination, toObjectId, parsers)
├── global/                       # ★ COPY/ADAPT — module @Global cung cấp service dùng chung
│   ├── global.module.ts
│   ├── jwt.service.ts            ← services/jwt.service.ts (decode/verify/sign, đọc secret từ env)
│   └── bcrypt.service.ts         ← services/bcrypt.service.ts
└── modules/                      # feature modules (controller/service/dto) — theo pattern rubric
    ├── auth/        # register · login · me  (JwtService + BcryptService + User)
    ├── users/       # admin: CRUD người dùng + phân quyền (role)
    ├── library/     # Kho học liệu: folders · files(link ngoài) · downloads("Của tôi")
    ├── question-bank/ # topics · questions (đa hình + 9 bảng chi tiết)
    ├── rubric/      # ★ kéo gần nguyên từ reference (schema khớp)
    ├── exercise/    # exercises · exercise-questions · attempts · participants · submissions · student-questions · self-assessment
    ├── article/     # blog
    └── settings/    # cấu hình hệ thống (singleton)
```

## Hạ tầng kéo về (Phase 1) — map file
| File ta tạo | Nguồn reference | Ghi chú adapt |
|---|---|---|
| `common/filters/all-exceptions.filter.ts` | `filters/catch-everything.filter.ts` | Envelope `{statusCode,error,message,timestamp,path}`, bắt Mongo 11000→409. Bỏ winston → dùng `Logger` của Nest. |
| `common/utils/index.ts` | `utils/index.ts` | Kéo: `getPagination`, `buildPagination`, `convertStringToObjectId`, `parseKeyword/Number/Boolean/Array/Date`. |
| `common/types/pagination.type.ts` | `types/index.ts` | `Pagination<T>`, `PaginationMetaDto`. |
| `common/dtos/pagination-query.dto.ts` | `dto/list-*.dto.ts` | `keyword? page? pageSize?` + `@Transform`. |
| `common/decorators/roles.decorator.ts` | `decorators/roles.decorator.ts` | `@Roles([...])` y nguyên. |
| `common/guards/roles.guard.ts` | `guards/roles.guard.ts` | Check `req.user.role` vs `@Roles`. |
| `common/guards/jwt-auth.guard.ts` | adapt từ `roles.guard.ts` | **Verify** token (secret env) → gán `req.user`; tôn trọng `@Public`. |
| `global/jwt.service.ts` | `services/jwt.service.ts` | `sign/verify/decode`, secret từ `ConfigService`. Dùng `@nestjs/jwt`. |
| `global/bcrypt.service.ts` | `services/bcrypt.service.ts` | `hash/compare` (bcryptjs). |

## Pattern mỗi module (theo `rubric` của reference)
- `*.module.ts`: khai báo controller + service (Model lấy qua `DatabaseModule` @Global, không cần forFeature).
- `*.controller.ts`: `@Controller({path,version})` + `@ApiTags` + `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` + `@CurrentUser()`; CRUD: list(phân trang) · get · create · update · delete.
- `*.service.ts`: inject `Model<T>`; `getPagination`+`$facet`+`buildPagination`; lọc theo `userId`/keyword; `BadRequestException`/`NotFoundException`.
- `dto/`: `class-validator` + `@ApiProperty`; update dùng `PartialType` (`@nestjs/mapped-types`).

## Phụ thuộc cần cài (Phase 0)
`@nestjs/jwt` · `bcryptjs` (+`@types/bcryptjs`) · `class-validator` · `class-transformer` · `@nestjs/mapped-types`.
*(Đã có: @nestjs/mongoose, mongoose, @nestjs/config, @nestjs/swagger.)*
Bỏ qua (không cần): passport, bull, throttler, redis/ioredis, event-emitter, winston, helmet (tùy chọn thêm sau).

## Lộ trình (phase)
0. **Setup**: cài deps; bật Swagger + ValidationPipe + filter trong `main.ts`.
1. **Common + Global**: kéo hạ tầng ở bảng trên; wire vào `app.module`.
2. **Auth + Users**: register/login/me (JWT), CRUD người dùng; seed 1 admin.
3. **Library** *(ưu tiên)*: folders + files(link ngoài, validate http) + downloads("Của tôi").
4. **Question-bank**: topics + questions đa hình (tạo question + bản ghi chi tiết theo `questionModel`).
5. **Rubric**: kéo service/controller/dto từ reference, chỉnh import schema sang `schemas/rubric/`.
6. **Exercise**: tạo đề + exercise-questions; làm bài (attempt/participant) → nộp (submission/student-question) → chấm; self-assessment.
7. **Article + Settings**: blog CRUD; settings get/update (singleton).
8. **Hoàn thiện**: Swagger group theo module; seed dữ liệu mẫu từ `frontend` (tùy chọn).

## Lưu ý khác biệt vs reference (chủ động bỏ/đổi)
- Single MongoDB (đã có `MongooseModule.forRootAsync`) — KHÔNG dùng tenant/`AdminService`/request-scoped như reference.
- Guard **verify** token thật (reference chỉ decode vì verify ở gateway).
- Không Redis ⇒ bỏ `RequestLockInterceptor`, Bull, Throttler.
- Logger: dùng `Logger` Nest thay winston.
